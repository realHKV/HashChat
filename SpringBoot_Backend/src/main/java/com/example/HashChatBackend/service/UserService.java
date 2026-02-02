package com.example.HashChatBackend.service;

import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.model.UserProfileDTO;
import com.example.HashChatBackend.repository.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private CloudinaryService cloudinaryService; // Inject CloudinaryService

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // private final String uploadDir = "uploads/profile-pics/"; // Remove this, no longer needed

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public UserProfileDTO updateProfile(String email, String name, String description, MultipartFile profilePic) {
        User user = getUserByEmail(email);

//        if (username != null && !username.equals(user.getUsername())) {
//            if (userRepository.existsByUsername(username)) {
//                throw new RuntimeException("Username already taken");
//            }
//            user.setUsername(username);
//        }

        if (name != null) user.setName(name);
        if (description != null) user.setDescription(description);

        if (profilePic != null && !profilePic.isEmpty()) {
            try {
                // If there's an existing profile picture, consider deleting it from Cloudinary
                if (user.getProfilePicUrl() != null && !user.getProfilePicUrl().isEmpty()) {
                    String publicId = cloudinaryService.extractPublicId(user.getProfilePicUrl());
                    if (publicId != null) {
                        cloudinaryService.deleteFile(publicId);
                    }
                }
                String profilePicUrl = cloudinaryService.uploadFile(profilePic, "profile-pics"); // Upload to "profile-pics" folder
                user.setProfilePicUrl(profilePicUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload profile picture to Cloudinary", e);
            }
        }

        user.setProfileCompleted(true);
        User savedUser=userRepository.save(user);

        messagingTemplate.convertAndSend("/topic/profileUpdates", new ProfileUpdateNotification(savedUser.getEmail()));
        return new UserProfileDTO(
                savedUser.getId(),
                savedUser.getEmail(),
//                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getDescription(),
                savedUser.getProfilePicUrl()
        );
    }

    // This method can be kept as is since it only checks for username availability
//    public boolean isUsernameAvailable(String username) {
//        return !userRepository.existsByUsername(username);
//    }

    static class ProfileUpdateNotification {
        private String email;

        public ProfileUpdateNotification(String email) {
            this.email = email;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}