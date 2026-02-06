package com.example.HashChatBackend.service;

import com.example.HashChatBackend.Exceptions.EmailNotVerifiedException;
import com.example.HashChatBackend.model.*;
import com.example.HashChatBackend.repository.RoomRepository;
import com.example.HashChatBackend.repository.UserRepo;
import com.example.HashChatBackend.repository.UserRoomMembershipRepository;
import com.example.HashChatBackend.utils.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.mongodb.core.MongoTemplate;
//import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private UserRoomMembershipRepository userRoomMembershipRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    // --- NEW INJECTIONS ---
    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    // ---------------------

    /**
     * Handles user signup.
     */
    @Transactional
    public String signup(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered!");
        }

        String otp = emailService.generateOTP();
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .isVerified(false)
                .verificationToken(otp)
                .name(name)
                .tokenExpiry(LocalDateTime.now().plusMinutes(10))
                .profileCompleted(false)
                .build();
        userRepository.save(user);

        emailService.sendVerificationEmail(email, otp);
        return "User registered successfully. Please check your email for verification.";
    }

    /**
     * Verifies the user's email.
     */
    @Transactional
    public String verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.isVerified()) {
            throw new RuntimeException("Email already verified.");
        }

        if (!otp.equals(user.getVerificationToken())) {
            throw new RuntimeException("Invalid OTP.");
        }

        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired. Please request a new one.");
        }

        user.setVerified(true);
        user.setVerificationToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        return jwtUtil.generateToken(userDetails.getUsername());
    }

    /**
     * Handles user login.
     */
    public String login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid email or password.");
        }

        User user = userOptional.get();

        if (!user.isVerified()) {
            emailService.sendVerificationEmail(user.getEmail(), user.getVerificationToken());
            throw new EmailNotVerifiedException("Your email is not verified. A new OTP has been sent. Please verify your email to log in.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        return jwtUtil.generateToken(userDetails.getUsername());
    }

    /**
     * Resends a new OTP.
     */
    @Transactional
    public String resendOTP(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.isVerified()) {
            throw new RuntimeException("Email already verified. Please login.");
        }

        String newOtp = emailService.generateOTP();
        user.setVerificationToken(newOtp);
        user.setTokenExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendVerificationEmail(email, newOtp);
        return "New OTP sent to your email for verification.";
    }

    /**
     * Deletes user account, removes profile pic, and anonymizes messages.
     */
    @Transactional
    public String deleteUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        // 1. Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Incorrect password. Account deletion failed.");
        }

        // 2. Delete Profile Picture from Cloudinary
        if (user.getProfilePicUrl() != null && !user.getProfilePicUrl().isEmpty()) {
            String publicId = cloudinaryService.extractPublicId(user.getProfilePicUrl());
            if (publicId != null) {
                try {
                    cloudinaryService.deleteFile(publicId);
                    System.out.println("Deleted Cloudinary image for user: " + email);
                } catch (IOException e) {
                    // Log error but continue deletion (don't block account deletion due to image server error)
                    System.err.println("Failed to delete image from Cloudinary: " + e.getMessage());
                }
            }
        }

        // 3. Anonymize Chat Messages in MongoDB
        try {
            // Find all rooms where this user has sent at least one message
            // "messages.SenderId" must match the field name in your MongoDB Message object (Case Sensitive!)
            Query query = new Query(Criteria.where("messages.SenderId").is(email));
            List<Room> rooms = mongoTemplate.find(query, Room.class);

            for (Room room : rooms) {
                boolean roomModified = false;
                if (room.getMessages() != null) {
                    for (Message msg : room.getMessages()) {
                        if (email.equals(msg.getSenderId())) {
                            // Anonymize the message details
                            msg.setSender("Deleted User");
                            msg.setImageUrl(null); // Remove their specific profile pic from the message
                            // Optional: You can keep SenderId as email to maintain grouping,
                            // or change it to "deleted" if you want total disassociation.
                            // Keeping it allows the frontend to group "Deleted User" messages together.

                            roomModified = true;
                        }
                    }
                }
                if (roomModified) {
                    roomRepository.save(room); // Save the updated room back to MongoDB
                }
            }
            System.out.println("Anonymized messages for user: " + email);
        } catch (Exception e) {
            System.err.println("Error anonymizing MongoDB messages: " + e.getMessage());
            // Proceed with deletion even if this fails, or throw exception based on strictness required
        }

        // 4. Delete PostgreSQL Data
        Long userId = user.getId();

        // Delete all user-room memberships
        userRoomMembershipRepository.deleteAll(
                userRoomMembershipRepository.findById_UserIdOrderByLastVisitedAtDesc(userId)
        );

        // Delete the user entity
        userRepository.delete(user);

        System.out.println("User account deleted successfully: " + email);
        return "Account deleted successfully.";
    }
}