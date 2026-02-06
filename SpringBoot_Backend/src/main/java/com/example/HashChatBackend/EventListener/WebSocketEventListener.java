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
    private UserService userService;

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = (String) headerAccessor.getHeader(SimpMessageHeaderAccessor.DESTINATION_HEADER);
        String sessionId = headerAccessor.getSessionId();

        // FIX 1: Ignore subscriptions that are NOT for private rooms
        // If it's global chat (/topic/global), we don't need to track presence
        if (destination == null || !destination.startsWith("/topic/room/")) {
            return;
        }

        // FIX 2: If we are here, it IS a private room. Now we check for a user.
        // If a Guest tries to subscribe to a private room, ignore or block them.
        if (event.getUser() == null) {
            // Guests cannot be tracked in private rooms because they have no DB ID.
            // Security: WebSocketConfig should already block this, but this prevents crashes.
            return;
        }

        String userEmail = event.getUser().getName();

        Matcher matcher = ROOM_ID_PATTERN.matcher(destination);
        if (matcher.matches()) {
            String roomId = matcher.group(1);

            User user = userService.getUserByEmail(userEmail);
            if (user == null) {
                System.err.println("User not found for email: " + userEmail);
                return;
            }

            List<UserProfileDTO> activeUserProfiles = userPresenceService.addUserToRoom(roomId, user.getId(), user.getEmail(), sessionId);
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/activeUsers", activeUserProfiles);
            System.out.println("User " + userEmail + " subscribed to room " + roomId + ". Active users updated.");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // FIX 3: Handle disconnects for Guests safely
        if (event.getUser() == null) {
            // Guest disconnected. Since guests aren't tracked in UserPresenceService,
            // we typically don't need to do anything here unless you track global guest counts.
            System.out.println("Guest user disconnected: " + sessionId);
            return;
        }

        String userEmail = event.getUser().getName();
        System.out.println("User disconnected: " + userEmail + " (Session ID: " + sessionId + ")");

        // Remove user from the room's active list
        RoomPresenceInfo roomPresenceInfo = userPresenceService.removeUserFromRoom(sessionId);

        if (roomPresenceInfo != null) {
            String roomId = roomPresenceInfo.getRoomId();
            List<UserProfileDTO> remainingActiveUserProfiles = roomPresenceInfo.getActiveUsers();
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/activeUsers", remainingActiveUserProfiles);
        }
    }
}