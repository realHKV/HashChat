package com.example.ChatAppWebSocketdemo.Service;

import com.example.ChatAppWebSocketdemo.Model.User;
import com.example.ChatAppWebSocketdemo.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepository;

    private final String uploadDir = "uploads/profile-pics/";

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(String email, String username, String name, String description, MultipartFile profilePic) {
        User user = getUserByEmail(email);

        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already taken");
            }
            user.setUsername(username);
        }

        if (name != null) user.setName(name);
        if (description != null) user.setDescription(description);

        if (profilePic != null && !profilePic.isEmpty()) {
            String profilePicUrl = saveProfilePicture(profilePic);
            user.setProfilePicUrl(profilePicUrl);
        }

        user.setProfileCompleted(true);
        return userRepository.save(user);
    }

    private String saveProfilePicture(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/profile-pics/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save profile picture");
        }
    }

    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }
}
