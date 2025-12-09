package com.nyad.thought_wall.repository;

import com.nyad.thought_wall.entity.Thought;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ThoughtRepository extends JpaRepository<Thought, Long> {

    @Query("SELECT t FROM Thought t WHERE t.user.email = :email AND t.room IS NULL")
    Page<Thought> findPersonalThoughts(String email, Pageable pageable);

    @Query("SELECT t FROM Thought t WHERE t.user.email = :email AND t.tag = :tag AND t.room IS NULL")
    Page<Thought> findPersonalThoughtsByTag(String email, String tag, Pageable pageable);

    Page<Thought> findByRoomId(Long roomId, Pageable pageable);
    
    Page<Thought> findByRoomIdAndTag(Long roomId, String tag, Pageable pageable);

    // NEW: Used for the Profile Page
    List<Thought> findByAssignedToEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE Thought t SET t.tag = :newTag WHERE t.tag = :oldTag AND t.user.email = :email AND t.room IS NULL")
    void updateTagForUser(String oldTag, String newTag, String email);
}