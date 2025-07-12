package com.example.ChatAppWebSocketdemo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

//    @Async
    public void sendVerificationEmail(String to, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            //message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Email Verification - Hash Chat App");
            message.setText(
                    "Hello,\n\n" +
                            "Thank you for signing up! Your verification code is: " + token + "\n\n" +
                            "This code will expire in 10 minutes.\n\n" +
                            "If you didn't request this verification, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "HashChat Team"
            );

            mailSender.send(message);
            System.out.println("Verification email sent successfully to: " + to);

        } catch (MailException e) {
            System.err.println("Failed to send email to: " + to);
            System.err.println("Error: " + e.getMessage());
            //e.printStackTrace();
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    public String generateOTP() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        String otpString = String.valueOf(otp);
        System.out.println("Generated OTP: " + otpString); // For debugging - remove in production
        return otpString;
    }
}