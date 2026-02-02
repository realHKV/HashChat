package com.example.HashChatBackend.repository;

import com.example.HashChatBackend.model.UserRoomMembership;
import com.example.HashChatBackend.model.UserRoomMembershipId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoomMembershipRepository extends JpaRepository<UserRoomMembership, UserRoomMembershipId> {

    // Find a specific membership by user ID and MongoDB Room ID
    Optional<UserRoomMembership> findById_UserIdAndId_RoomMongoId(Long userId, String roomMongoId);

    // Find all memberships for a specific user, ordered by last visited
    List<UserRoomMembership> findById_UserIdOrderByLastVisitedAtDesc(Long userId);

    //find all memberships for a given roomId
    List<UserRoomMembership> findById_RoomMongoId(String roomMongoId);

    // Find a specific membership by user ID and MongoDB Room ID (useful for existence check)
    boolean existsById_UserIdAndId_RoomMongoId(Long userId, String roomMongoId);
}