package org.catudo.sentiment.sentimentanalyststreaming.service;

import org.catudo.sentiment.sentimentanalyststreaming.models.Comments;
import org.catudo.sentiment.sentimentanalyststreaming.models.QueryComments;
import org.catudo.sentiment.sentimentanalyststreaming.models.RedditSentimentMessage;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@Service
@Slf4j
public class RedditSentimentConsumer {

    private final RedditService redditService;
    private final SentimentService sentimentService;
    private final org.catudo.sentiment.sentimentanalyststreaming.repository.CommentsRepository commentsRepository;
    private final org.catudo.sentiment.sentimentanalyststreaming.repository.QueryCommentsRepository queryCommentsRepository;

    public RedditSentimentConsumer(RedditService redditService,
            SentimentService sentimentService,
            org.catudo.sentiment.sentimentanalyststreaming.repository.CommentsRepository commentsRepository,
            org.catudo.sentiment.sentimentanalyststreaming.repository.QueryCommentsRepository queryCommentsRepository) {
        this.redditService = redditService;
        this.sentimentService = sentimentService;
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

							var result = sentimentService.analyze(redditComment.getBody());

							Comments comment = new Comments();
							comment.setTitle(submission.getTitle());
							comment.setContent(redditComment.getBody());
							comment.setUrl(submission.getUrl());
							comment.setScore(java.math.BigDecimal.valueOf(submission.getScore()));
							comment.setAuthor(message.getUser());
							comment.setSubreddit(message.getSubreddit());
							comment.setSubject(message.getSubject());

							comment.setSentiment(result.getLabel());
							comment.setSentimentScore(result.getScore());

							comment.setUser(message.getUser());
							comment.setQuery(queryComment);

							commentsRepository.save(comment);
							savedCount++;

						} catch (Exception e) {
							log.error("Error processing comment", e);
						}
					}
				}

				queryComment.setFinished(true);
				queryCommentsRepository.save(queryComment);

				log.info("Finished processing. Saved {} comments.", savedCount);
			}

        } catch (Exception e) {
            log.error("Error in consumer", e);
        }
    }
}
