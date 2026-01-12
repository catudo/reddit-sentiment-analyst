package org.catudo.sentiment.sentimentanalyststreaming.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class RedditSentimentMessage {

	private String subreddit;
	private String subject;
	private String user;
	@JsonProperty("query_comment_id")
	private Integer queryCommentId;
	@JsonProperty("count")
	private Integer counter;

}
