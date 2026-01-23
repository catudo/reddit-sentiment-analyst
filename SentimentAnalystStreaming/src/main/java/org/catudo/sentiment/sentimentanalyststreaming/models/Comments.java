package org.catudo.sentiment.sentimentanalyststreaming.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import org.hibernate.annotations.CreationTimestamp;

@Data
@Entity
@Table(name = "comments")
public class Comments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String content; // models.TextField
    private String url;
    private BigDecimal score;
    private String author;
    private String subreddit;

    @CreationTimestamp
    private LocalDateTime createdUtc;

    private String subject;
    private String sentiment;
    private Double sentimentScore;

	@Column(name = "\"user\"")
    private String user;

    @ManyToOne
    @JoinColumn(name = "query_id") // standard mapping for ForeignKey
    private QueryComments query;
}
