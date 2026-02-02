package com.example.HashChatBackend.controllers;

import com.example.HashChatBackend.model.Room;
import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.model.UserProfileDTO;
import com.example.HashChatBackend.model.UserRoomMembership;
import com.example.HashChatBackend.service.UserRoomService;
import com.example.HashChatBackend.service.UserService;
import com.example.HashChatBackend.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
//@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRoomService userRoomService;

    /**
     * Retrieves the profile of the authenticated user.
     * The user's email is extracted from the JWT token in the Authorization header.
     *
     * @param authHeader The Authorization header containing the JWT token (e.g., "Bearer <token>").
     * @return ResponseEntity with user profile details or an error.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        System.out.println("Received Authorization header: " + authHeader);
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String email = jwtUtil.getEmailFromToken(token); // Extract email from token
            User user = userService.getUserByEmail(email);

            System.out.println("User object: " + user);
            System.out.println("User ID: " + user.getId());
            System.out.println("User Email: " + user.getEmail());
//            System.out.println("User Username: " + user.getUsername());
            System.out.println("User Name: " + user.getName());
            System.out.println("User Description: " + user.getDescription());
            System.out.println("User Profile Pic URL: " + user.getProfilePicUrl());
            System.out.println("User Profile Completed: " + user.isProfileCompleted());

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
//                    "username", user.getUsername() != null ? user.getUsername() : "",
                    "name", user.getName() != null ? user.getName() : "",
                    "description", user.getDescription() != null ? user.getDescription() : "",
                    "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "",
                    "profileCompleted", user.isProfileCompleted()
            ));
        } catch (Exception e) {
            e.printStackTrace(); // Print stack trace for debugging
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: " + e.getMessage()));
        }
    }

    /**
     * Updates the profile of the authenticated user.
     * The user's email is extracted from the JWT token.
     *
     * @param authHeader The Authorization header containing the JWT token.
//     * @param username Optional new username.
     * @param name Optional new name.
     * @param description Optional new description.
     * @param profilePic Optional new profile picture file.
     * @return ResponseEntity with updated user profile details or an error.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
//            @RequestParam(required = false) String username,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile profilePic) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String email = jwtUtil.getEmailFromToken(token); // Extract email from token

            UserProfileDTO updatedProfile = userService.updateProfile(email,  name, description, profilePic); //

            return ResponseEntity.ok(updatedProfile);

        } catch (RuntimeException e) {
            // Catch specific exceptions like "User not found" or "Username already taken"
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * Checks if a given username is available.
     *
//     * @param username The username to check.
     * @return ResponseEntity indicating if the username is available.
     */
//    @GetMapping("/check-username")
//    public ResponseEntity<?> checkUsername(@RequestParam String username) {
//        boolean available = userService.isUsernameAvailable(username);
//        return ResponseEntity.ok(Map.of("available", available));
//    }

    @GetMapping("/profile-by-email")
    public ResponseEntity<?> getProfileByEmail(@RequestParam String email) {
        try {
            User user = userService.getUserByEmail(email); // Use your existing service method

            // Return only necessary public profile info
            return ResponseEntity.ok(Map.of(
                    "email", user.getEmail(), // Include email for mapping on frontend
                    "name", user.getName() != null ? user.getName() : email.split("@")[0], // Fallback name
                    "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "",
                    "description", user.getDescription() != null ? user.getDescription() : ""
            ));
        } catch (RuntimeException e) { // Catch the RuntimeException from UserService.getUserByEmail
            return ResponseEntity.status(404).body(Map.of("error", "User not found with email: " + email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred: " + e.getMessage()));
        }
    }

    /**
     * Retrieves a list of rooms the authenticated user has previously connected to,
     * ordered by their last visit time.
     * The user's ID is extracted from the JWT token in the Authorization header.
     *
     * Endpoint: GET /api/v1/user/rooms/history
     * Example: /api/v1/user/rooms/history?limit=10
     *
     * @param authHeader The Authorization header containing the JWT token (e.g., "Bearer <token>").
     * @param limit An optional query parameter to limit the number of rooms returned (default to 10).
     * @return ResponseEntity containing a list of Room objects or an error.
     */
    @GetMapping("/rooms/history")
    public ResponseEntity<?> getPreviouslyConnectedRooms(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String email = jwtUtil.getEmailFromToken(token); // Extract email from token

            // Retrieve the full User object to get their Long ID
            User user = userService.getUserByEmail(email);
            Long userId = user.getId();

            if (userId == null) {
                // This scenario indicates a problem if getUserByEmail returned a User without an ID
                // (shouldn't happen for a valid user, but good for defensive programming).
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User ID not found for authenticated user."));
            }

            // Call the UserRoomService to get the room history
            List<Room> rooms = userRoomService.getPreviouslyVisitedRooms(userId, limit);

            // Return the list of Room objects
            return ResponseEntity.ok(rooms);

        } catch (Exception e) {
            // Log the exception for debugging purposes (e.g., using SLF4J/Logback)
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve room history: " + e.getMessage()));
        }
    }
    /**
     * Records a user's visit to a specific room, creating or updating a membership record.
     * The user's ID is extracted from the JWT token in the Authorization header.
     *
     * Endpoint: POST /api/v1/user/rooms/visit/{roomMongoId}
     *
     * @param authHeader The Authorization header containing the JWT token.
     * @param roomMongoId The MongoDB _id of the room being visited.
     * @return ResponseEntity with the created/updated UserRoomMembership or an error.
     */
    @PostMapping("/rooms/visit/{roomMongoId}")
    public ResponseEntity<?> recordRoomVisit(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String roomMongoId) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String userEmail = jwtUtil.getEmailFromToken(token); // Extract email from token

            // Retrieve the full User object to get their Long ID
            // Make sure your userService.getUserByEmail method returns a User object that
            // has its PostgreSQL 'id' populated.
            User user = userService.getUserByEmail(userEmail);
            Long userId = user.getId();

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User ID not found for authenticated user."));
            }

            // Call the service method to record the visit
            UserRoomMembership membership = userRoomService.recordRoomVisit(userId, roomMongoId);
            return ResponseEntity.ok(membership); // Return the saved membership object

        } catch (Exception e) {
            e.printStackTrace(); // Log the exception for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to record room visit: " + e.getMessage()));
        }
    }

    /**
     * Retrieves a list of simplified profiles for all distinct users
     * who have ever visited a specific room. This endpoint does NOT
     * require authentication, as it's used to populate a fallback cache
     * when a user first connects to a room.
     *
     * Endpoint: GET /api/v1/user/room/{roomMongoId}/past-users
     *
     * @param roomMongoId The MongoDB _id of the room.
     * @return ResponseEntity containing a list of simplified user profile Maps.
     */
    @GetMapping("/room/{roomMongoId}/past-users")
    public ResponseEntity<?> getPastUsersInRoom(@PathVariable String roomMongoId) { //rom1
        try {
            System.out.println("roomMongoId:"+roomMongoId);
            List<Map<String, Object>> pastUsers = userRoomService.getDistinctUserProfilesInRoom(roomMongoId);
            System.out.println("PastUsers:"+pastUsers);
            return ResponseEntity.ok(pastUsers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve past room users: " + e.getMessage()));
        }
    }

}

