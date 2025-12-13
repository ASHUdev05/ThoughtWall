package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.ThoughtRepository;
import com.nyad.thought_wall.repository.UserRepository;
import com.nyad.thought_wall.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "${app.frontend.url}")
public class ThoughtController {

    @Autowired private ThoughtRepository repository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoomRepository roomRepository;

    @GetMapping
    public Page<Thought> getAllThoughts(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Principal principal
    ) {
        // Sort: Incomplete tasks first, then Pinned, then Newest
        Sort sort = Sort.by(Sort.Order.asc("completed"), Sort.Order.desc("pinned"), Sort.Order.desc("createdAt"));
        Pageable pageable = PageRequest.of(page, size, sort);
        String email = principal.getName();

        if (roomId != null) {
            // Room Context
            // FIX: Handle missing room gracefully
            Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
            
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            // Valid member check
            if(!room.getMembers().contains(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

            if (tag != null && !tag.equals("All") && !tag.isEmpty()) {
                return repository.findByRoomIdAndTag(roomId, tag, pageable);
            }
            return repository.findByRoomId(roomId, pageable);
        } else {
            // Personal Context
            if (tag != null && !tag.equals("All") && !tag.isEmpty()) {
                return repository.findPersonalThoughtsByTag(email, tag, pageable);
            }
            return repository.findPersonalThoughts(email, pageable);
        }
    }

    @PostMapping
    public Thought createThought(@RequestBody ThoughtRequest request, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        Thought thought = new Thought();
        thought.setContent(request.content);
        thought.setTag(request.tag);
        thought.setUser(user);
        thought.setCompleted(false);

        if (request.roomId != null) {
            // FIX: Specific error if room doesn't exist
            Room room = roomRepository.findById(request.roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
            
            if(!room.getMembers().contains(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            thought.setRoom(room);
        }
        
        return repository.save(thought);
    }

    @PutMapping("/{id}")
    public Thought updateThought(@PathVariable Long id, @RequestBody Thought updates, Principal principal) {
        Thought thought = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thought not found"));
        
        // Ensure user has access (simplified: either owner or in the same room)
        boolean isOwner = thought.getUser().getEmail().equals(principal.getName());
        boolean inSameRoom = thought.getRoom() != null && thought.getRoom().getMembers().stream()
                             .anyMatch(u -> u.getEmail().equals(principal.getName()));

        if (!isOwner && !inSameRoom) {
             throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        thought.setContent(updates.getContent());
        thought.setTag(updates.getTag());
        thought.setPinned(updates.isPinned());
        thought.setCompleted(updates.isCompleted());
        
        if (updates.getAssignedTo() != null) {
             User assignee = userRepository.findById(updates.getAssignedTo().getId()).orElse(null);
             thought.setAssignedTo(assignee);
        } else {
             thought.setAssignedTo(null);
        }

        return repository.save(thought);
    }

    @DeleteMapping("/{id}")
    public void deleteThought(@PathVariable Long id, Principal principal) {
        Thought thought = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thought not found"));
        
        // Only owner can delete (or room admin - logic kept simple for now)
        if (!thought.getUser().getEmail().equals(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        repository.deleteById(id);
    }
    
    @PutMapping("/tags/migrate")
    public void migrateTag(@RequestParam String oldTag, @RequestParam String newTag, Principal principal) {
        repository.updateTagForUser(oldTag, newTag, principal.getName());
    }

    // DTO
    static class ThoughtRequest {
        public String content;
        public String tag;
        public Long roomId;
    }
}