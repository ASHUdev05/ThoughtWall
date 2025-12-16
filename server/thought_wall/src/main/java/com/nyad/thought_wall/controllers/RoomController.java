package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.RoomJoinRequest;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.RoomJoinRequestRepository;
import com.nyad.thought_wall.repository.RoomRepository;
import com.nyad.thought_wall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "${app.frontend.url}")
public class RoomController {

    @Autowired private RoomRepository roomRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoomJoinRequestRepository requestRepository;

    @PostMapping
    public Room createRoom(@RequestBody String roomName, Principal principal) {
        User user = getUser(principal);
        String code = generateUniqueCode();
        Room room = new Room(roomName.replace("\"", ""), code, user);
        return roomRepository.save(room);
    }

    // MODIFIED: Creates a join request instead of adding immediately
    @PostMapping("/join/{code}")
    public ResponseEntity<?> joinRoom(@PathVariable String code, Principal principal) {
        User user = getUser(principal);
        Room room = roomRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        
        if (room.getMembers().contains(user)) {
            return ResponseEntity.badRequest().body("Already a member");
        }
        
        // Check if owner
        if (room.getOwner().equals(user)) {
             return ResponseEntity.badRequest().body("You are the owner");
        }

        // Check pending
        if (requestRepository.findByRoomIdAndUserId(room.getId(), user.getId()).isPresent()) {
            return ResponseEntity.badRequest().body("Request already pending");
        }

        requestRepository.save(new RoomJoinRequest(room, user));
        return ResponseEntity.ok(Map.of("message", "Request sent to room owner"));
    }

    // NEW: Get pending requests for a room (Owner only)
    @GetMapping("/{id}/requests")
    public List<RoomJoinRequest> getRoomRequests(@PathVariable Long id, Principal principal) {
        Room room = getOwnedRoom(id, principal);
        return requestRepository.findByRoomId(room.getId());
    }

    // NEW: Approve a request
    @PostMapping("/{roomId}/requests/{requestId}/approve")
    public void approveRequest(@PathVariable Long roomId, @PathVariable Long requestId, Principal principal) {
        Room room = getOwnedRoom(roomId, principal);
        RoomJoinRequest req = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        if (!req.getRoom().getId().equals(roomId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);

        room.addMember(req.getUser());
        roomRepository.save(room);
        requestRepository.delete(req);
    }

    // NEW: Reject a request
    @DeleteMapping("/{roomId}/requests/{requestId}")
    public void rejectRequest(@PathVariable Long roomId, @PathVariable Long requestId, Principal principal) {
        getOwnedRoom(roomId, principal); // Verify ownership
        requestRepository.deleteById(requestId);
    }

    // NEW: Kick a user
    @DeleteMapping("/{roomId}/members/{userId}")
    public void kickUser(@PathVariable Long roomId, @PathVariable Long userId, Principal principal) {
        Room room = getOwnedRoom(roomId, principal);
        User userToRemove = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        if (room.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot kick owner");
        }

        room.getMembers().remove(userToRemove);
        roomRepository.save(room);
    }

    @GetMapping
    public Set<Room> getMyRooms(Principal principal) {
        User user = getUser(principal);
        return user.getJoinedRooms();
    }
    
    @GetMapping("/{id}/members")
    public Set<User> getRoomMembers(@PathVariable Long id, Principal principal) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        if (!room.getMembers().contains(getUser(principal))) {
             throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return room.getMembers();
    }

    @DeleteMapping("/{id}")
    public void deleteRoom(@PathVariable Long id, Principal principal) {
        Room room = getOwnedRoom(id, principal);
        roomRepository.delete(room);
    }

    private Room getOwnedRoom(Long roomId, Principal principal) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!room.getOwner().getEmail().equals(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can perform this action");
        }
        return room;
    }

    private User getUser(Principal p) {
        return userRepository.findByEmail(p.getName()).orElseThrow();
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (roomRepository.existsByCode(code));
        return code;
    }
}