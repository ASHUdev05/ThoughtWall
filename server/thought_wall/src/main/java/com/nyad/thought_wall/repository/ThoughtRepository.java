package com.nyad.thought_wall.repository;

import com.nyad.thought_wall.entity.Thought;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ThoughtRepository extends JpaRepository<Thought, Long> {
    Page<Thought> findByTag(String tag, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Thought t SET t.tag = :newTag WHERE t.tag = :oldTag")
    void updateTagForThoughts(String oldTag, String newTag);
}