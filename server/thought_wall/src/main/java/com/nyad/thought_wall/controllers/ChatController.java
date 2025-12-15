package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.ChatMessage;
import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.ChatMessageRepository;
import com.nyad.thought_wall.repository.RoomRepository;
import com.nyad.thought_wall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller // Mix of @Controller (for WS) and @RestController logic
public class ChatController {

    @Autowired private ChatMessageRepository chatRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private UserRepository userRepository;

    // WebSocket Endpoint: /app/chat/{roomId}
    // Broadcasts to: /topic/room/{roomId}/chat
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}/chat")
    public ChatMessage sendMessage(@Payload Map<String, String> payload, @DestinationVariable Long roomId) {
        String content = payload.get("content");
        String email = payload.get("email"); // We pass email from client for now

        Room room = roomRepository.findById(roomId).orElseThrow();
        User sender = userRepository.findByEmail(email).orElseThrow();

        ChatMessage message = new ChatMessage();
        message.setContent(content);
        message.setRoom(room);
        message.setSender(sender);
        
        return chatRepository.save(message);
    }

    // REST Endpoint: Get History
    @GetMapping("/api/rooms/{roomId}/messages")
    @ResponseBody
    @CrossOrigin(origins = "${app.frontend.url}")
    public List<ChatMessage> getChatHistory(@PathVariable Long roomId) {
        return chatRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }
}