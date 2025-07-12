package com.example.ChatAppWebSocketdemo.Controller;

import com.example.ChatAppWebSocketdemo.Model.User;
import com.example.ChatAppWebSocketdemo.Service.UserService;
import com.example.ChatAppWebSocketdemo.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        System.out.println("Received Authorization header: " + authHeader);
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.getEmailFromToken(token);
            User user = userService.getUserByEmail(email);

            // --- ADD THESE DEBUG PRINTS ---
            System.out.println("User object: " + user); // If toString() is implemented
            System.out.println("User ID: " + user.getId());
            System.out.println("User Email: " + user.getEmail());
            System.out.println("User Username: " + user.getUsername());
            System.out.println("User Name: " + user.getName());
            System.out.println("User Description: " + user.getDescription());
            System.out.println("User Profile Pic URL: " + user.getProfilePicUrl());
            System.out.println("User Profile Completed: " + user.isProfileCompleted());
            // --- END DEBUG PRINTS ---

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "username", user.getUsername() != null ? user.getUsername() : "",
                    "name", user.getName() != null ? user.getName() : "",
                    "description", user.getDescription() != null ? user.getDescription() : "",
                    "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "",
                    "profileCompleted", user.isProfileCompleted()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile profilePic) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.getEmailFromToken(token);

            User user = userService.updateProfile(email, username, name, description, profilePic);

            // --- ADD THESE DEBUG PRINTS ---
            System.out.println("User object: " + user); // If toString() is implemented
            System.out.println("User ID: " + user.getId());
            System.out.println("User Email: " + user.getEmail());
            System.out.println("User Username: " + user.getUsername());
            System.out.println("User Name: " + user.getName());
            System.out.println("User Description: " + user.getDescription());
            System.out.println("User Profile Pic URL: " + user.getProfilePicUrl());
            System.out.println("User Profile Completed: " + user.isProfileCompleted());
            // --- END DEBUG PRINTS ---

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "username", user.getUsername() != null ? user.getUsername() : "",
                    "name", user.getName() != null ? user.getName() : "",
                    "description", user.getDescription() != null ? user.getDescription() : "",
                    "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "",
                    "profileCompleted", user.isProfileCompleted()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ResponseEntity.ok(Map.of("available", available));
    }
}

