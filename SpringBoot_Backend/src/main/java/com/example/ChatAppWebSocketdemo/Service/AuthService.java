package com.example.ChatAppWebSocketdemo.Service;

import com.example.ChatAppWebSocketdemo.Model.User;
import com.example.ChatAppWebSocketdemo.Repository.UserRepo;
import com.example.ChatAppWebSocketdemo.Util.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public String signup(String email, String password) {
        try {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already exists");
            }

            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setVerified(false);

            String otp = emailService.generateOTP();
            user.setVerificationToken(otp);
            user.setTokenExpiry(LocalDateTime.now().plusMinutes(10));

            emailService.sendVerificationEmail(email, otp);
            userRepository.save(user);
            System.out.println("Verification email sent successfully");

            return "User registered successfully. Please check your email for verification code.";

        }catch (Exception e) {
            System.err.println("Signup failed for email: " + email);
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Signup failed: " + e.getMessage());

        }
    }

    public String verifyEmail(String email, String otp) {
        try {
            System.out.println("Email verification attempt for: " + email + " with OTP: " + otp);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found");
            }

            User user = userOpt.get();
            if (user.isVerified()) {
                throw new RuntimeException("Email already verified");
            }

            if (!otp.equals(user.getVerificationToken())) {
                System.out.println("OTP mismatch. Expected: " + user.getVerificationToken() + ", Received: " + otp);
                throw new RuntimeException("Invalid OTP");
            }

            if (LocalDateTime.now().isAfter(user.getTokenExpiry())) {
                throw new RuntimeException("OTP expired");
            }

            user.setVerified(true);
            user.setVerificationToken(null);
            user.setTokenExpiry(null);
            userRepository.save(user);

            return jwtUtil.generateToken(email);

        } catch (Exception e) {
            System.err.println("Email verification failed: " + e.getMessage());
            throw e;
        }
    }

    public String login(String email, String password) {
        try {
            System.out.println("Login attempt for email: " + email);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("Invalid credentials");
            }

            User user = userOpt.get();
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new RuntimeException("Invalid credentials");
            }

            if (!user.isVerified()) {
                throw new RuntimeException("Email not verified");
            }

            return jwtUtil.generateToken(email);

        } catch (Exception e) {
            System.err.println("Login failed: " + e.getMessage());
            throw e;
        }
    }

    @Transactional
    public String resendOTP(String email) {
        try {
            System.out.println("Resend OTP request for email: " + email);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found");
            }

            User user = userOpt.get();
            if (user.isVerified()) {
                throw new RuntimeException("Email already verified");
            }

            String otp = emailService.generateOTP();
            user.setVerificationToken(otp);
            user.setTokenExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);

            emailService.sendVerificationEmail(email, otp);
            return "OTP sent successfully";

        } catch (Exception e) {
            System.err.println("Resend OTP failed: " + e.getMessage());
            throw e;
        }
    }
}
