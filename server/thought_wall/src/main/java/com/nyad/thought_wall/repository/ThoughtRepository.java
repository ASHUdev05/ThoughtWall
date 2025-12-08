package com.nyad.thought_wall.repository;

import com.nyad.thought_wall.entity.Thought;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThoughtRepository extends JpaRepository<Thought, Long> {
    
}