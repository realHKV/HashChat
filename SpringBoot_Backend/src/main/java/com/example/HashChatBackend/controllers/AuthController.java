package com.example.HashChatBackend.controllers;

import com.example.HashChatBackend.Exceptions.EmailNotVerifiedException;
import com.example.HashChatBackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
//@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Handles user signup requests.
     *
     * @param request A map containing "email" and "password".
     * @return ResponseEntity with a success message or an error.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String name = request.get("name");

            String message = authService.signup(email, password,name);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Handles email verification requests.
     *
     * @param request A map containing "email" and "otp".
     * @return ResponseEntity with a JWT token on success or an error.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            String token = authService.verifyEmail(email, otp);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Handles user login requests.
     *
     * @param request A map containing "email" and "password".
     * @return ResponseEntity with a JWT token on success or an error.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String token = authService.login(email, password);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (EmailNotVerifiedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN) // Use FORBIDDEN (403) or UNAUTHORIZED (401)
                    .body(Map.of("error", e.getMessage(), "errorCode", "EMAIL_NOT_VERIFIED"));
        } catch (BadCredentialsException e) {
            // Catch specific Spring Security authentication failures
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Catch any other unexpected exceptions
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Handles requests to resend OTP for email verification.
     *
     * @param request A map containing "email".
     * @return ResponseEntity with a success message or an error.
     */


    //ADD JWT HERE OR DIE
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOTP(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String message = authService.resendOTP(email);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
