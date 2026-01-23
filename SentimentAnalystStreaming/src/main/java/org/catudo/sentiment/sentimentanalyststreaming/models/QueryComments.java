package org.catudo.sentiment.sentimentanalyststreaming.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Data
@Entity
@Table(name = "query_comments")
public class QueryComments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subject;
    private String subreddit;
    // In Python 'user' was CharField, likely the username string.
    // If it's a foreign key to User table, we might need a relationship,
    // but the python model definition shows just CharField max_length=100 in one
    // place,
    // wait, looking at models.py: user = models.CharField(max_length=100)
    @Column(name = "\"user\"")
    private String user;

    private boolean finished;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
