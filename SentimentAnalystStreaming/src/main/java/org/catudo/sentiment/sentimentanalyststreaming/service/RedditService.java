package org.catudo.sentiment.sentimentanalyststreaming.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class RedditService {

    @Value("${reddit.client.id}")
    private String clientId;

    @Value("${reddit.client.secret}")
    private String clientSecret;

    @Value("${reddit.user.agent}")
    private String userAgent;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String accessToken;
    private long tokenExpiration = 0;

    private synchronized String getAccessToken() {
        if (System.currentTimeMillis() < tokenExpiration && accessToken != null) {
            return accessToken;
        }

        try {
            String url = "https://www.reddit.com/api/v1/access_token";
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(clientId, clientSecret);
            headers.set(HttpHeaders.USER_AGENT, userAgent);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "client_credentials");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, request, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode body = response.getBody();
                accessToken = body.get("access_token").asText();
                int expiresIn = body.get("expires_in").asInt();
                tokenExpiration = System.currentTimeMillis() + (expiresIn * 1000L) - 10000; // buffer
                return accessToken;
            }
        } catch (Exception e) {
            log.error("Failed to authenticate with Reddit", e);
        }
        return null;
    }

    @Data
    public static class RedditSubmission {
        private String id;
        private String title;
        private String url;
        private int score;
        private String selftext;
    }

    @Data
    public static class RedditComment {
        private String body;
        private String author;
        private int score;
    }

    public List<RedditSubmission> searchSubreddit(String subreddit, String query, int limit) {
        String token = getAccessToken();
        if (token == null)
            return Collections.emptyList();

        String url = String.format("https://oauth.reddit.com/r/%s/search?q=%s&sort=hot&limit=%d&t=month&restrict_sr=on",
                subreddit, query, limit);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.set(HttpHeaders.USER_AGENT, userAgent);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

            List<RedditSubmission> results = new ArrayList<>();
            if (response.getBody() != null && response.getBody().has("data")) {
                JsonNode children = response.getBody().get("data").get("children");
                for (JsonNode child : children) {
                    JsonNode data = child.get("data");
                    RedditSubmission sub = new RedditSubmission();
                    sub.setId(data.get("id").asText());
                    sub.setTitle(data.has("title") ? data.get("title").asText() : "");
                    sub.setUrl(data.has("url") ? data.get("url").asText() : "");
                    sub.setScore(data.has("score") ? data.get("score").asInt() : 0);
                    sub.setSelftext(data.has("selftext") ? data.get("selftext").asText() : "");
                    results.add(sub);
                }
            }
            return results;
        } catch (Exception e) {
            log.error("Error searching subreddit", e);
            return Collections.emptyList();
        }
    }

    public List<RedditComment> getComments(String submissionId, int limit) {
        String token = getAccessToken();
        if (token == null)
            return Collections.emptyList();

        // Getting comments: https://oauth.reddit.com/comments/{article}
        String url = String.format("https://oauth.reddit.com/comments/%s?limit=%d&depth=1", submissionId, limit);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.set(HttpHeaders.USER_AGENT, userAgent);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

            List<RedditComment> comments = new ArrayList<>();
            // Response is an array: [Listing(submission), Listing(comments)]
            if (response.getBody() != null && response.getBody().isArray() && response.getBody().size() > 1) {
                JsonNode commentsListing = response.getBody().get(1);
                if (commentsListing.has("data") && commentsListing.get("data").has("children")) {
                    for (JsonNode child : commentsListing.get("data").get("children")) {
                        if ("t1".equals(child.get("kind").asText())) { // t1 = comment
                            JsonNode data = child.get("data");
                            RedditComment comment = new RedditComment();
                            comment.setBody(data.has("body") ? data.get("body").asText() : "");
                            comment.setAuthor(data.has("author") ? data.get("author").asText() : "");
                            comment.setScore(data.has("score") ? data.get("score").asInt() : 0);
                            comments.add(comment);
                        }
                    }
                }
            }
            return comments;
        } catch (Exception e) {
            log.error("Error fetching comments", e);
            return Collections.emptyList();
        }
    }
}
