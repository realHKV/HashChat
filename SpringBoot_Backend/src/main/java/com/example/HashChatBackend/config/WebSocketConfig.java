package com.example.HashChatBackend.config;

import com.example.HashChatBackend.service.CustomUserDetailsService;
import com.example.HashChatBackend.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic"); // Enables simple broker for /topic destinations
        config.setApplicationDestinationPrefixes("/app");
        // Client sends to /app/chat, /app/global/sendMessage, etc.
        // Server publishes to /topic/room/{roomId}, /topic/global, etc.
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat") // WebSocket connection endpoint
                .setAllowedOrigins(frontendUrl) // Allow frontend origin
                .withSockJS();
    }

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // 1. Handle CONNECTION (Authentication)
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
                    List<String> guestHeaders = accessor.getNativeHeader("X-Guest-Mode");
                    boolean isGuestMode = guestHeaders != null && !guestHeaders.isEmpty()
                            && "true".equalsIgnoreCase(guestHeaders.getFirst());

                    String token = null;
                    if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                        String bearerToken = authorizationHeaders.getFirst();
                        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                            token = bearerToken.substring(7);
                        }
                    }

                    // A. Guest Mode: Allow connection, but User Principal remains NULL
                    if (isGuestMode) {
                        System.out.println("WebSocket CONNECT: Guest user connecting (Session ID: " + accessor.getSessionId() + ")");
                        return message;
                    }

                    // B. Authenticated Mode: Validate Token
                    if (token != null && jwtUtil.validateToken(token)) {
                        String userEmail = jwtUtil.getEmailFromToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                        accessor.setUser(authentication);
                        System.out.println("WebSocket Authenticated User: " + userEmail);
                    } else {
                        System.err.println("WebSocket CONNECT: Invalid or missing JWT");
                        // Optional: Throw exception to reject connection immediately
                    }
                }

                // 2. Handle SUBSCRIPTION (Security Gatekeeper) -- THIS WAS MISSING
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    Authentication user = (Authentication) accessor.getUser();
                    boolean isGuest = (user == null); // Guests have no Authentication object

                    // BLOCK: If user is a Guest AND trying to access a private room
                    if (isGuest && destination != null && destination.startsWith("/topic/room/")) {
                        System.err.println("SECURITY ALERT: Guest tried to subscribe to private room: " + destination);
                        throw new IllegalArgumentException("Guests are not allowed in private rooms.");
                    }
                }

                return message;
            }
        });
    }
}
