package org.catudo.sentiment.sentimentanalyststreaming.service;

import lombok.extern.slf4j.Slf4j;
import org.catudo.sentiment.sentimentanalyststreaming.models.Comments;
import org.catudo.sentiment.sentimentanalyststreaming.repository.CommentsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class ProcessQueries {

	private final  CommentsRepository commentsRepository;
	private final SentimentService sentimentService;


	@Autowired
	public ProcessQueries(CommentsRepository commentsRepository,SentimentService sentimentService) {
		this.commentsRepository = commentsRepository;
		this.sentimentService = sentimentService;
	}
	public void getCommentsToProcess(Long queryCommentId){
		List<Comments> comments = commentsRepository.findAllByQuery_Id(queryCommentId);

		for (Comments comment : comments) {
			var result = sentimentService.analyze(comment.getContent());
			comment.setSentiment(result.getLabel());
			comment.setSentimentScore(result.getScore());commentsRepository.save(comment);
		}
	}
}
