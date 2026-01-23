package org.catudo.sentiment.sentimentanalyststreaming.service;

import org.catudo.sentiment.sentimentanalyststreaming.models.Comments;
import org.catudo.sentiment.sentimentanalyststreaming.models.QueryComments;
import org.catudo.sentiment.sentimentanalyststreaming.models.RedditSentimentMessage;
import org.catudo.sentiment.sentimentanalyststreaming.repository.CommentsRepository;
import org.catudo.sentiment.sentimentanalyststreaming.repository.QueryCommentsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.Objects;

@Service
@Slf4j
public class RedditSentimentConsumer {

    private final RedditService redditService;
    private final ProcessQueries processQueries;
    private final CommentsRepository commentsRepository;
    private final QueryCommentsRepository queryCommentsRepository;

	@Autowired
    public RedditSentimentConsumer(RedditService redditService,
								   ProcessQueries processQueries,
								   CommentsRepository commentsRepository,
								   QueryCommentsRepository queryCommentsRepository) {
        this.redditService = redditService;
		this.processQueries = processQueries;
		this.commentsRepository = commentsRepository;
        this.queryCommentsRepository = queryCommentsRepository;
    }

    @KafkaListener(topics = "${spring.kafka.topic.name}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(RedditSentimentMessage message) {
        log.info("Received message: {}", message);

        try {
			QueryComments queryComment = queryCommentsRepository.findById(Long.valueOf(message.getQueryCommentId()))
                        .orElse(null);

            if (Objects.nonNull(queryComment)) {
				int count = message.getCounter() != null ? message.getCounter() : 100;
				var submissions = redditService.searchSubreddit(message.getSubreddit(), message.getSubject(), count);

				int savedCount = 0;

				for (var submission : submissions) {
					var comments = redditService.getComments(submission.getId(), 100);

					for (var redditComment : comments) {
						try {
							Comments comment = new Comments();
							comment.setTitle(submission.getTitle());
							comment.setContent(redditComment.getBody());
							comment.setUrl(submission.getUrl());
							comment.setScore(java.math.BigDecimal.valueOf(submission.getScore()));
							comment.setAuthor(message.getUser());
							comment.setSubreddit(message.getSubreddit());
							comment.setSubject(message.getSubject());
							comment.setUser(message.getUser());
							comment.setQuery(queryComment);
							commentsRepository.save(comment);
							savedCount++;
						} catch (Exception e) {
							log.error("Error processing comment", e);
						}
					}
				}

				processQueries.getCommentsToProcess(queryComment.getId());

				queryComment.setFinished(true);
				queryCommentsRepository.save(queryComment);

				log.info("Finished processing. Saved {} comments.", savedCount);
			}

        } catch (Exception e) {
            log.error("Error in consumer", e);
        }
    }
}
