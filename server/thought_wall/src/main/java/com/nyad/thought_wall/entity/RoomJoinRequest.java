package com.nyad.thought_wall.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_requests")
public class RoomJoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime requestedAt;

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }

    public RoomJoinRequest() {}

    public RoomJoinRequest(Room room, User user) {
        this.room = room;
        this.user = user;
    }

    // Getters
    public Long getId() { return id; }
    public Room getRoom() { return room; }
    public User getUser() { return user; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
}