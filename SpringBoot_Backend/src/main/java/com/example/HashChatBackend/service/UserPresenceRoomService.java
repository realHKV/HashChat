package com.example.HashChatBackend.service;

import com.example.HashChatBackend.model.RoomPresenceInfo;
import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.model.UserProfileDTO;
import com.example.HashChatBackend.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class UserPresenceRoomService {

    // Map: roomId -> Set of active user IDs (Long) for fast lookup
    private final Map<String, Set<Long>> roomActiveUsers = new ConcurrentHashMap<>();

    // Map: sessionId -> RoomPresenceInfo (to quickly find which room a session belongs to)
    // RoomPresenceInfo will now contain the actual room ID and the user's ID
    private final Map<String, UserSessionInfo> sessionRoomMap = new ConcurrentHashMap<>();

    @Autowired
    private UserRepo userRepository; // Inject your UserRepository

    public static class UserSessionInfo {
        private String roomId;
        private Long userId; // Store the actual PostgreSQL ID
        private String userEmail; // Keep email for convenience, but userId is primary

        public UserSessionInfo(String roomId, Long userId, String userEmail) {
            this.roomId = roomId;
            this.userId = userId;
            this.userEmail = userEmail;
        }

        public String getRoomId() { return roomId; }
        public Long getUserId() { return userId; }
        public String getUserEmail() { return userEmail; }
    }

    public List<UserProfileDTO> addUserToRoom(String roomId, Long userId, String userEmail, String sessionId) {
        // Add user ID to the room's active set
        roomActiveUsers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(userId);

        // Store session info
        sessionRoomMap.put(sessionId, new UserSessionInfo(roomId, userId, userEmail));

        return getActiveUserProfilesInRoom(roomId); // Return full profiles
    }

    public RoomPresenceInfo removeUserFromRoom(String sessionId) {
        UserSessionInfo sessionInfo = sessionRoomMap.remove(sessionId);

        if (sessionInfo != null) {
            String roomId = sessionInfo.getRoomId();
            Long userId = sessionInfo.getUserId();

            Set<Long> activeUsersInRoom = roomActiveUsers.get(roomId);
            if (activeUsersInRoom != null) {
                activeUsersInRoom.remove(userId);
                if (activeUsersInRoom.isEmpty()) {
                    roomActiveUsers.remove(roomId); // Clean up empty room
                }
            }
            // Now, return a RoomPresenceInfo containing the list of *remaining* active user profiles
            return new RoomPresenceInfo(roomId, getActiveUserProfilesInRoom(roomId)); // Return full profiles
        }
        return null;
    }

    public List<UserProfileDTO> getActiveUserProfilesInRoom(String roomId) {
        Set<Long> userIdsInRoom = roomActiveUsers.get(roomId);
        if (userIdsInRoom == null || userIdsInRoom.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        // Fetch User entities from the database using their IDs
        List<User> users = userRepository.findAllById(userIdsInRoom);

        // Convert User entities to UserProfileDto
        return users.stream()
                .map(user -> new UserProfileDTO(
                        user.getId(),
                        user.getEmail(),
//                        user.getUsername(),
                        user.getName() != null ? user.getName() : user.getEmail().split("@")[0], // Fallback name
                        user.getDescription(),
                        user.getProfilePicUrl() != null ? user.getProfilePicUrl() : ""
                ))
                .collect(Collectors.toList());
    }

    // You might also need a method to get a single user's profile by email/ID if your other services need it.
    public UserProfileDTO getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email).orElse(null); // Assuming findByEmail exists
        if (user != null) {
            return new UserProfileDTO(
                    user.getId(),
                    user.getEmail(),
//                    user.getUsername(),
                    user.getName() != null ? user.getName() : user.getEmail().split("@")[0],
                    user.getDescription() !=null ? user.getDescription() : "",
                    user.getProfilePicUrl() != null ? user.getProfilePicUrl() : ""
            );
        }
        return null;
    }
}
