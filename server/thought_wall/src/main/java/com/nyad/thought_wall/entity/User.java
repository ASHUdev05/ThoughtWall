package com.nyad.thought_wall.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @ManyToMany(mappedBy = "members")
    @JsonIgnore
    private Set<Room> joinedRooms = new HashSet<>();

    // Cascade: If User is deleted, delete their Owned Rooms
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Room> ownedRooms = new HashSet<>();

    // Cascade: If User is deleted, delete their Personal Thoughts
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Thought> thoughts = new HashSet<>();

    // Helper to find tasks assigned TO this user
    @OneToMany(mappedBy = "assignedTo")
    @JsonIgnore
    private Set<Thought> assignedTasks = new HashSet<>();

    // Cleanup logic before deletion
    @PreRemove
    private void preRemove() {
        // 1. Unassign from tasks (don't delete the task, just remove assignment)
        for (Thought t : assignedTasks) {
            t.setAssignedTo(null);
        }
        // 2. Remove self from joined rooms (updates Join Table)
        for (Room r : joinedRooms) {
            r.getMembers().remove(this);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Set<Room> getJoinedRooms() { return joinedRooms; }
    public void setJoinedRooms(Set<Room> joinedRooms) { this.joinedRooms = joinedRooms; }
    public Set<Room> getOwnedRooms() { return ownedRooms; }
    public void setOwnedRooms(Set<Room> ownedRooms) { this.ownedRooms = ownedRooms; }
}