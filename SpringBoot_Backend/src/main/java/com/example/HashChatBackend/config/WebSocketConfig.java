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
        config.enableSimpleBroker("/topic"); //
        config.setApplicationDestinationPrefixes("/app");
        // /app/chat
        //server side: @MessageMapping("/chat")
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat") //connection establishment handshake endpoint
                .setAllowedOrigins(frontendUrl)//frontend origin
                .withSockJS();
    }
    // /chat endpoint connection establish
    @Autowired
    private JwtUtil jwtUtil; // Inject your JWT utility class

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");

                    String token = null;
                    if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                        String bearerToken = authorizationHeaders.get(0);
                        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                            token = bearerToken.substring(7);
                        }
                    }

                    // Use your jwtUtil methods here
                    if (token != null && jwtUtil.validateToken(token)) { // Note: validateToken in JwtUtil takes UserDetails, but for CONNECT frame, you might not have it loaded yet. You can overload it or simplify.
                        String userEmail = jwtUtil.getEmailFromToken(token);

                        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        accessor.setUser(authentication);
                        System.out.println("WebSocket Authenticated User: " + userEmail + " (Session ID: " + accessor.getSessionId() + ")");
                    } else {
                        System.err.println("WebSocket CONNECT: Invalid or missing JWT for session " + accessor.getSessionId());
                    }
                }
                return message;
            }
        });
    }
}
