package org.catudo.sentiment.sentimentanalyststreaming.repository;

import org.catudo.sentiment.sentimentanalyststreaming.models.Comments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentsRepository extends JpaRepository<Comments, Long> {
}
