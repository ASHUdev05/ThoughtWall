package com.nyad.thought_wall.repository;

import com.nyad.thought_wall.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Fetch messages for a specific room, ordered by time
    List<ChatMessage> findByRoomIdOrderByTimestampAsc(Long roomId);
}