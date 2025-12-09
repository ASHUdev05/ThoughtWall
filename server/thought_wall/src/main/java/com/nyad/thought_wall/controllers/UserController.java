package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.ThoughtRepository;
import com.nyad.thought_wall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${app.frontend.url}")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private ThoughtRepository thoughtRepository;

    @GetMapping("/profile")
    public UserProfileDTO getProfile(Principal principal) {
        User user = getUser(principal);
        List<Thought> assigned = thoughtRepository.findByAssignedToEmail(user.getEmail());
        
        List<AssignedThoughtDTO> assignedDTOs = assigned.stream()
            .map(t -> new AssignedThoughtDTO(
                t.getId(), 
                t.getContent(), 
                t.getRoom() != null ? t.getRoom().getName() : "Personal",
                t.isCompleted()
            ))
            .collect(Collectors.toList());

        return new UserProfileDTO(
            user.getEmail(),
            user.getOwnedRooms(),
            user.getJoinedRooms(),
            assignedDTOs
        );
    }

    @DeleteMapping("/me")
    public void deleteAccount(Principal principal) {
        User user = getUser(principal);
        userRepository.delete(user);
    }

    private User getUser(Principal p) {
        return userRepository.findByEmail(p.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    // DTOs for Profile Response
    static class UserProfileDTO {
        public String email;
        public Set<Room> ownedRooms;
        public Set<Room> joinedRooms;
        public List<AssignedThoughtDTO> assignedTasks;

        public UserProfileDTO(String email, Set<Room> ownedRooms, Set<Room> joinedRooms, List<AssignedThoughtDTO> assignedTasks) {
            this.email = email;
            this.ownedRooms = ownedRooms;
            this.joinedRooms = joinedRooms;
            this.assignedTasks = assignedTasks;
        }
    }

    static class AssignedThoughtDTO {
        public Long id;
        public String content;
        public String roomName;
        public boolean completed;

        public AssignedThoughtDTO(Long id, String content, String roomName, boolean completed) {
            this.id = id;
            this.content = content;
            this.roomName = roomName;
            this.completed = completed;
        }
    }
}