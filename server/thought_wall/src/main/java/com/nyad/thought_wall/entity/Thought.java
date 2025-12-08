package com.nyad.thought_wall.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "thoughts")
public class Thought {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The actual message content
    @Column(nullable = false)
    private String content;

    // Default constructor is required by JPA
    public Thought() {
    }

    // Constructor for easy creation
    public Thought(String content) {
        this.content = content;
    }

    // --- Getters and Setters ---
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}