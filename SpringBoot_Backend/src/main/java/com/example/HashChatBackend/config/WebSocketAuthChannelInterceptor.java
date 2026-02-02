package com.example.HashChatBackend.config;

import com.example.HashChatBackend.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;


// is the custom interceptor that reads the JWT from the WebSocket CONNECT headers,
// validates it, and sets the Principal for the WebSocket session.

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Only process CONNECT commands for authentication
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization"); // Get Authorization header

            if (token == null || !token.startsWith("Bearer ")) {
                System.err.println("WebSocket CONNECT: No Authorization header or invalid format. Rejecting connection.");
                // Reject connection if token is missing or malformed
                throw new MessageDeliveryException("Unauthorized: Missing or invalid Authorization header.");
            }

            token = token.substring(7); // Remove "Bearer " prefix
            try {
                String email = jwtUtil.getEmailFromToken(token);

                if (email == null) {
                    System.err.println("WebSocket CONNECT: Email could not be extracted from token. Rejecting connection.");
                    throw new MessageDeliveryException("Unauthorized: Invalid JWT token (email missing).");
                }

                UserDetails userDetails = null;
                try {
                    userDetails = userDetailsService.loadUserByUsername(email);
                } catch (UsernameNotFoundException e) {
                    System.err.println("WebSocket CONNECT: User not found for email '" + email + "'. Rejecting connection.");
                    throw new MessageDeliveryException("Unauthorized: User not found.");
                }

                if (jwtUtil.validateToken(token, userDetails)) {
                    // Create an authenticated token
                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    // Set the authenticated user in the WebSocket session
                    accessor.setUser(authentication);
                    // Also set in SecurityContextHolder (optional but good practice)
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("WebSocket CONNECT: User authenticated: " + email);
                } else {
                    System.err.println("WebSocket CONNECT: JWT validation failed for token: " + token + ". Rejecting connection.");
                    throw new MessageDeliveryException("Unauthorized: Invalid JWT token.");
                }
            } catch (MessageDeliveryException e) {
                // Re-throw MessageDeliveryException directly
                throw e;
            } catch (Exception e) {
                System.err.println("WebSocket CONNECT: Unexpected error during JWT authentication: " + e.getMessage() + ". Rejecting connection.");
                // Catch any other unexpected exceptions and reject connection
                throw new MessageDeliveryException("Unauthorized: Authentication error during WebSocket handshake.");
            }
        }
        return message; // Allow the message to proceed if not a CONNECT command or if authenticated
    }
}