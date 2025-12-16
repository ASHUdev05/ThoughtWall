package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.ThoughtRepository;
import com.nyad.thought_wall.repository.UserRepository;
import com.nyad.thought_wall.repository.RoomRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "${app.frontend.url}")
public class ThoughtController {

    @Autowired private ThoughtRepository repository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public Page<Thought> getAllThoughts(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal
    ) {
        Sort sort = Sort.by(
            Sort.Order.asc("completed"),
            Sort.Order.asc("dueDate"),
            Sort.Order.desc("pinned"),
            Sort.Order.desc("createdAt")
        );
        Pageable pageable = PageRequest.of(page, size, sort);
        String email = principal.getName();

        if (roomId != null) {
            Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
            
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            if(!room.getMembers().contains(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

            if (tag != null && !tag.equals("All") && !tag.isEmpty()) {
                return repository.findByRoomIdAndTag(roomId, tag, pageable);
            }
            return repository.findByRoomId(roomId, pageable);
        } else {
            if (tag != null && !tag.equals("All") && !tag.isEmpty()) {
                return repository.findPersonalThoughtsByTag(email, tag, pageable);
            }
            return repository.findPersonalThoughts(email, pageable);
        }
    }

    @PostMapping
    public Thought createThought(@Valid @RequestBody ThoughtRequest request, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        Thought thought = new Thought();
        thought.setContent(request.content);
        thought.setTag(request.tag == null || request.tag.isEmpty() ? "General" : request.tag);
        thought.setUser(user);
        thought.setDueDate(request.dueDate);
        thought.setCompleted(false);

        if (request.roomId != null) {
            Room room = roomRepository.findById(request.roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
            
            if(!room.getMembers().contains(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            thought.setRoom(room);
        }
        
        Thought saved = repository.save(thought);
        notifyRoom(saved.getRoom());
        return saved;
    }

    @PutMapping("/{id}")
    public Thought updateThought(@PathVariable Long id, @RequestBody Thought updates, Principal principal) {
        Thought thought = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thought not found"));
        
        boolean isOwner = thought.getUser().getEmail().equals(principal.getName());
        boolean inSameRoom = thought.getRoom() != null && thought.getRoom().getMembers().stream()
                             .anyMatch(u -> u.getEmail().equals(principal.getName()));

        if (!isOwner && !inSameRoom) {
             throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (updates.getContent() != null && !updates.getContent().isBlank()) {
            thought.setContent(updates.getContent());
        }
        if (updates.getTag() != null) thought.setTag(updates.getTag());
        thought.setPinned(updates.isPinned());
        thought.setCompleted(updates.isCompleted());
        thought.setDueDate(updates.getDueDate());
        
        if (updates.getAssignedTo() != null) {
             User assignee = userRepository.findById(updates.getAssignedTo().getId()).orElse(null);
             thought.setAssignedTo(assignee);
        } else {
             thought.setAssignedTo(null);
        }

        Thought saved = repository.save(thought);
        notifyRoom(saved.getRoom());
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteThought(@PathVariable Long id, Principal principal) {
        Thought thought = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thought not found"));
        
        if (!thought.getUser().getEmail().equals(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Room room = thought.getRoom();
        repository.deleteById(id);
        notifyRoom(room);
    }
    
    @PutMapping("/tags/migrate")
    public void migrateTag(@RequestParam String oldTag, @RequestParam String newTag, Principal principal) {
        repository.updateTagForUser(oldTag, newTag, principal.getName());
    }

    private void notifyRoom(Room room) {
        if (room != null) {
            messagingTemplate.convertAndSend("/topic/room/" + room.getId(), "UPDATE");
        }
    }

    static class ThoughtRequest {
        @NotBlank(message = "Content cannot be empty")
        @Size(max = 1000, message = "Content too long")
        public String content;
        
        @Size(max = 20, message = "Tag too long")
        public String tag;
        
        public Long roomId;
        public LocalDateTime dueDate;
    }
}