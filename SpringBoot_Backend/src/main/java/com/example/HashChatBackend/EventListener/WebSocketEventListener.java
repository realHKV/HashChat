package com.example.HashChatBackend.EventListener;

import com.example.HashChatBackend.model.RoomPresenceInfo;
import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.model.UserProfileDTO;
import com.example.HashChatBackend.service.UserPresenceRoomService;
import com.example.HashChatBackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WebSocketEventListener {

    private static final Pattern ROOM_ID_PATTERN = Pattern.compile("^/topic/room/([^/]+).*$");

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserPresenceRoomService userPresenceService;

    @Autowired
    private UserService userService; // Inject UserService to get User object by email

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = (String) headerAccessor.getHeader(SimpMessageHeaderAccessor.DESTINATION_HEADER);
        String sessionId = headerAccessor.getSessionId();
        String userEmail = Objects.requireNonNull(event.getUser()).getName(); // Principal name is email

        if (destination != null && destination.startsWith("/topic/room/")) {
            Matcher matcher = ROOM_ID_PATTERN.matcher(destination);
            if (matcher.matches()) {
                String roomId = matcher.group(1);

                // Get the actual User object to pass its ID to the presence service
                User user = userService.getUserByEmail(userEmail); // Fetch user details from DB
                if (user == null) {
                    System.err.println("User not found for email: " + userEmail + " during subscription.");
                    return; // Or handle as an error
                }

                // Add user (using ID and email) to the room's active list
                List<UserProfileDTO> activeUserProfiles = userPresenceService.addUserToRoom(roomId, user.getId(), user.getEmail(), sessionId);

                // Notify all clients in this room about the updated active user list
                messagingTemplate.convertAndSend("/topic/room/" + roomId + "/activeUsers", activeUserProfiles);
                System.out.println("User " + userEmail + " subscribed to room " + roomId + ". Active user profiles sent.");
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userEmail = (event.getUser() != null) ? event.getUser().getName() : "Unknown User";

        System.out.println("User disconnected: " + userEmail + " (Session ID: " + sessionId + ")");

        // Remove user from the room's active list and get affected room with updated profiles
        RoomPresenceInfo roomPresenceInfo = userPresenceService.removeUserFromRoom(sessionId);

        if (roomPresenceInfo != null) {
            String roomId = roomPresenceInfo.getRoomId();
            List<UserProfileDTO> remainingActiveUserProfiles = roomPresenceInfo.getActiveUsers(); // Get the updated list of profiles
            // Notify all clients in the affected room about the updated active user list
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/activeUsers", remainingActiveUserProfiles);
            System.out.println("User " + userEmail + " disconnected from room " + roomId + ". Remaining active user profiles sent.");
        }
    }
}