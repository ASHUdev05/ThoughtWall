package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Room;
import com.nyad.thought_wall.entity.User;
import com.nyad.thought_wall.repository.RoomRepository;
import com.nyad.thought_wall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "${app.frontend.url}")
public class RoomController {

    @Autowired private RoomRepository roomRepository;
    @Autowired private UserRepository userRepository;

    @PostMapping
    public Room createRoom(@RequestBody String roomName, Principal principal) {
        User user = getUser(principal);
        String code = generateUniqueCode();
        Room room = new Room(roomName.replace("\"", ""), code, user);
        return roomRepository.save(room);
    }

    @PostMapping("/join/{code}")
    public Room joinRoom(@PathVariable String code, Principal principal) {
        User user = getUser(principal);
        Room room = roomRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        
        room.addMember(user);
        return roomRepository.save(room);
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
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        // Security: Only Owner can delete
        if (!room.getOwner().getEmail().equals(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can delete this room");
        }

        roomRepository.delete(room);
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