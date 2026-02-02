package com.example.HashChatBackend.service;

import com.example.HashChatBackend.Exceptions.EmailNotVerifiedException;
import com.example.HashChatBackend.model.User;
import com.example.HashChatBackend.repository.UserRepo;
import com.example.HashChatBackend.utils.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepo userRepository;

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

    /**
     * Handles user signup. Creates a new user, generates an OTP, and sends a verification email.
     *
     * @param email The user's email.
     * @param password The user's password.
     * @return A success message.
     * @throws RuntimeException if the email is already registered.
     */
    @Transactional
    public String signup(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered!");
        }

        String otp = emailService.generateOTP();
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password)) // Encode password
                .isVerified(false)
                .verificationToken(otp)
                .name(name)
                .tokenExpiry(LocalDateTime.now().plusMinutes(10)) // OTP valid for 10 minutes
                .profileCompleted(false) // Default to false on signup
                .build();
        userRepository.save(user);

        emailService.sendVerificationEmail(email, otp);
        return "User registered successfully. Please check your email for verification.";
    }

    /**
     * Verifies the user's email using the provided OTP.
     *
     * @param email The user's email.
     * @param otp The OTP received by the user.
     * @return A JWT token on successful verification.
     * @throws RuntimeException if the user is not found, OTP is invalid/expired, or email is already verified.
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
        user.setVerificationToken(null); // Clear token after successful verification
        user.setTokenExpiry(null);
        userRepository.save(user);

        // Generate JWT token upon successful verification
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        // Corrected: Pass the username (email) from UserDetails
        return jwtUtil.generateToken(userDetails.getUsername());
    }

    /**
     * Handles user login. Authenticates credentials and generates a JWT token.
     *
     * @param email The user's email.
     * @param password The user's password.
     * @return A JWT token on successful login.
     * @throws RuntimeException if authentication fails or email is not verified.
     */
    public String login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid email or password.");
        }

        User user = userOptional.get();

        if (!user.isVerified()) {
            // Optional: Resend OTP here if you want to give them a fresh one on login attempt
            emailService.sendVerificationEmail(user.getEmail(), user.getVerificationToken());
            throw new EmailNotVerifiedException("Your email is not verified. A new OTP has been sent. Please verify your email to log in.");
        }

        try {
            // Authenticate using Spring Security's AuthenticationManager
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password.");
        }

        // If authentication is successful, generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        // Corrected: Pass the username (email) from UserDetails
        return jwtUtil.generateToken(userDetails.getUsername());
    }

    /**
     * Resends a new OTP to the user's email for verification.
     *
     * @param email The user's email.
     * @return A success message.
     * @throws RuntimeException if the user is not found or email is already verified.
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
        user.setTokenExpiry(LocalDateTime.now().plusMinutes(10)); // New OTP valid for 10 minutes
        userRepository.save(user);

        emailService.sendVerificationEmail(email, newOtp);
        return "New OTP sent to your email for verification.";
    }
}