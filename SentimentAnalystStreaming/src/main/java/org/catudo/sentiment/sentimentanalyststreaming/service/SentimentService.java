package org.catudo.sentiment.sentimentanalyststreaming.service;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

public interface SentimentService {

    @Data
    @Builder
    class SentimentResult {
        private String label;
        private double score;
    }

    SentimentResult analyze(String text);
}
