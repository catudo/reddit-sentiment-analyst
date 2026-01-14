package org.catudo.sentiment.sentimentanalyststreaming.repository;

import org.catudo.sentiment.sentimentanalyststreaming.models.QueryComments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QueryCommentsRepository extends JpaRepository<QueryComments, Long> {
}
