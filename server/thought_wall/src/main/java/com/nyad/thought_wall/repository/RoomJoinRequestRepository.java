package com.nyad.thought_wall.repository;

import com.nyad.thought_wall.entity.RoomJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoomJoinRequestRepository extends JpaRepository<RoomJoinRequest, Long> {
    List<RoomJoinRequest> findByRoomId(Long roomId);
    Optional<RoomJoinRequest> findByRoomIdAndUserId(Long roomId, Long userId);
}