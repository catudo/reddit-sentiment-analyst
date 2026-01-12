package org.catudo.sentiment.sentimentanalyststreaming.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.catudo.sentiment.sentimentanalyststreaming.models.RedditSentimentMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.kafka.test.context.EmbeddedKafka;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "reddit-sentiment-topic")
@TestPropertySource(properties = {
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "spring.kafka.consumer.auto-offset-reset=earliest"
})
class RedditSentimentConsumerTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoSpyBean
    private RedditSentimentConsumer redditSentimentConsumer;

    @Value("${spring.kafka.topic.name}")
    private String topicName;

    @Test
    public void testConsume() {
        RedditSentimentMessage message = new RedditSentimentMessage();
        message.setSubreddit("test-subreddit");
        message.setSubject("test-subject");
        message.setUser("test-user");
        message.setQueryCommentId(12345);

        kafkaTemplate.send(topicName, message);

        verify(redditSentimentConsumer, timeout(10000).times(1)).consume(any(RedditSentimentMessage.class));
    }

    @TestConfiguration
    static class KafkaTestConfig {

        @Bean
        public ProducerFactory<String, Object> producerFactory(
                @Value("${spring.embedded.kafka.brokers}") String brokers) {
            Map<String, Object> configs = new HashMap<>();
            configs.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, brokers);
            configs.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
            configs.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JacksonJsonSerializer.class);
            return new DefaultKafkaProducerFactory<>(configs);
        }

        @Bean
        public KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
            return new KafkaTemplate<>(producerFactory);
        }
    }
}
