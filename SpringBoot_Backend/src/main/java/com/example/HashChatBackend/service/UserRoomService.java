package com.example.HashChatBackend.service;

import com.example.HashChatBackend.model.Room;
import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.model.UserRoomMembership;
import com.example.HashChatBackend.model.UserRoomMembershipId;
import com.example.HashChatBackend.repository.RoomRepository;
import com.example.HashChatBackend.repository.UserRepo;
import com.example.HashChatBackend.repository.UserRoomMembershipRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserRoomService {

    @Autowired
    private UserRoomMembershipRepository userRoomMembershipRepository;

    @Autowired
    private MongoTemplate mongoTemplate; // Used to interact with MongoDB

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private RoomRepository roomRepository;

    /**
     * Handles a user entering/viewing a room.
     * Inserts a new membership or updates the last_visited_at for an existing one.
     *
     * @param userId The ID of the user (from PostgreSQL).
     * @param roomMongoId The _id of the room (from MongoDB).
     * @return The updated or newly created UserRoomMembership.
     */
    @Transactional
    public UserRoomMembership recordRoomVisit(Long userId, String roomMongoId) {
        // 1. Fetch the actual User entity from PostgreSQL
        // This is crucial because the UserRoomMembership entity's 'user' field
        // expects a non-null User object reference due to @ManyToOne and nullable=false.
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Use findById to see if a record exists
        Optional<UserRoomMembership> existingMembership = userRoomMembershipRepository.findById(new UserRoomMembershipId(userId, roomMongoId));

        UserRoomMembership membership;
        if (existingMembership.isPresent()) {
            membership = existingMembership.get();
            membership.setLastVisitedAt(LocalDateTime.now());
            // No need to set user again, as it's already associated with the fetched entity
        } else {
            membership = UserRoomMembership.builder()
                    .id(new UserRoomMembershipId(userId, roomMongoId))
                    .user(user) // <--- CRUCIAL FIX: Set the fetched User object here
                    .joinedAt(LocalDateTime.now())
                    .lastVisitedAt(LocalDateTime.now())
                    .build();
        }
        return userRoomMembershipRepository.save(membership);
    }

    /**
     * Retrieves the most recently visited rooms for a given user.
     * This involves querying PostgreSQL for room IDs, then MongoDB for room details.
     *
     * @param userId The ID of the user (from PostgreSQL).
     * @param limit The maximum number of rooms to retrieve.
     * @return A list of Room objects from MongoDB, ordered by last visited.
     */
    public List<Room> getPreviouslyVisitedRooms(Long userId, int limit) {
        // 1. Query PostgreSQL for room_mongo_ids and order them
        List<UserRoomMembership> memberships = userRoomMembershipRepository.findById_UserIdOrderByLastVisitedAtDesc(userId);

        // Limit the results from PostgreSQL before querying MongoDB
        List<String> roomMongoIds = memberships.stream()
                .map(m -> m.getId().getRoomMongoId())
                .limit(limit) // Apply limit here
                .collect(Collectors.toList());

        if (roomMongoIds.isEmpty()) {
            return new ArrayList<>(); // No rooms found for this user
        }

        // 2. Query MongoDB for the actual Room documents using their _ids
        Query query = new Query(Criteria.where("id").in(roomMongoIds));
        List<Room> rooms = mongoTemplate.find(query, Room.class);

        // 3. (Optional) Re-sort the rooms to match the PostgreSQL ordering
        // MongoDB's $in query doesn't guarantee order.
        // You might want to create a Map for faster lookup if 'limit' is large,
        // or just iterate through the ordered 'memberships' list and find the room.
        Map<String, Room> roomMap = rooms.stream()
                .collect(Collectors.toMap(Room::getId, room -> room));

        return memberships.stream()
                .filter(m -> roomMap.containsKey(m.getId().getRoomMongoId()))
                .map(m -> roomMap.get(m.getId().getRoomMongoId()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves distinct user profiles for all users who have ever visited a given room.
     * This serves as the fallback data set for profile pictures.
     *
     * @param roomMongoId The MongoDB _id of the room.
     * @return A list of Maps, each representing a simplified user profile.
     */
    public List<Map<String, Object>> getDistinctUserProfilesInRoom(String roomMongoId) {
        //Convert roomMongoId from rom1 to actual mongoRoomId
        Room room = roomRepository.findByRoomId(roomMongoId);
        String actualMongoRoomId=room.getId();
        System.out.println("actualMongoRoomId"+actualMongoRoomId);

        // 1. Get all memberships for the given room
        List<UserRoomMembership> memberships = userRoomMembershipRepository.findById_RoomMongoId(actualMongoRoomId);

        // 2. Extract distinct user IDs
        Set<Long> userIds = memberships.stream()
                .map(m -> m.getId().getUserId())
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. Fetch User entities from PostgreSQL using the distinct IDs
        List<User> users = userRepo.findAllById(userIds);

        // 4. Map User entities to simplified profile data (Map)
        return users.stream()
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "email", user.getEmail(),
//                        "username", user.getUsername() != null ? user.getUsername() : "",
                        "name", user.getName() != null ? user.getName() : user.getEmail().split("@")[0], // Fallback name
                        "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : ""
                ))
                .collect(Collectors.toList());
    }
}