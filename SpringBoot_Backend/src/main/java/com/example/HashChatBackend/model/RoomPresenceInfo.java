package com.example.HashChatBackend.model;



// Helper DTO for returning room and its users on disconnect

import java.util.List;
import java.util.Set;


public class RoomPresenceInfo {
    private final String roomId;
    private final List<UserProfileDTO> activeUsers;;

    public RoomPresenceInfo(String roomId, List<UserProfileDTO> activeUsers) {
        this.roomId = roomId;
        this.activeUsers = activeUsers;
    }

    public String getRoomId() {
        return roomId;
    }

    public List<UserProfileDTO> getActiveUsers() { // Changed return type
        return activeUsers;
    }
}