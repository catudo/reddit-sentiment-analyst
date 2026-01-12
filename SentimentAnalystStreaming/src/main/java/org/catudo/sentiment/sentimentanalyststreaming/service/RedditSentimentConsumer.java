package org.catudo.sentiment.sentimentanalyststreaming.service;

import org.catudo.sentiment.sentimentanalyststreaming.models.RedditSentimentMessage;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RedditSentimentConsumer {

    @KafkaListener(topics = "${spring.kafka.topic.name}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(RedditSentimentMessage message) {
        log.info("Received message: {}", message);
    }
}
