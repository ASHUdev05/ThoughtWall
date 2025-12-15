package com.nyad.thought_wall.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String content;

    private LocalDateTime timestamp;

    // The user who sent the message
    @ManyToOne
    @JoinColumn(name = "sender_id")
    @JsonIgnoreProperties({"password", "thoughts", "joinedRooms", "ownedRooms", "assignedTasks"}) 
    private User sender;

    // The room this message belongs to
    @ManyToOne
    @JoinColumn(name = "room_id")
    @JsonIgnoreProperties("members") // Prevent recursion
    private Room room;

    public ChatMessage() {}

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
}