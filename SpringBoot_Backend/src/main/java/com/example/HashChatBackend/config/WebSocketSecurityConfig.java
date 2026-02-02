//package com.example.HashChatBackend.config;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.messaging.simp.SimpMessageType;
//import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
//import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
//
//@Configuration
//@EnableWebSocketSecurity // Enables Spring Security for WebSockets
//public class WebSocketSecurityConfig { // No need to extend AbstractWebSocketSecurityConfigurer directly
//
//    // This method configures inbound message security
//    // It's automatically picked up by @EnableWebSocketSecurity
//    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
//        messages
//                // Allow CONNECT, DISCONNECT, and other internal message types without explicit authentication checks
//                // Authentication for CONNECT is handled by WebSocketAuthChannelInterceptor
//                .simpTypeMatchers(SimpMessageType.CONNECT, SimpMessageType.DISCONNECT, SimpMessageType.OTHER).permitAll()
//                // Allow subscription to public topics (e.g., /topic/room/{roomId})
//                .simpDestMatchers("/topic/**").permitAll()
//                // Require authentication for messages sent to /app (your application destinations)
//                // This means sendMessage method will require an authenticated Principal
//                .simpDestMatchers("/app/**").authenticated()
//                // Any other message types (e.g., custom types) also require authentication
//                .anyMessage().authenticated();
//    }
//
//    // This method disables CSRF for WebSocket connections.
//    // It's typically part of the WebSocketSecurityConfigurerAdapter, but can be managed here.
//    // If you are using Spring Boot 3+, this might be configured differently or not needed if JWT is sole authentication.
//    // For now, let's assume it's still relevant if you had it before.
//    // Note: This method is usually part of an adapter, so if you're not extending one,
//    // you might need to manage CSRF at a higher level or rely on JWT.
//    // For simplicity, if you're directly using @EnableWebSocketSecurity and defining configureInbound,
//    // CSRF for websockets is often implicitly handled by JWT authentication.
//    // If you face CSRF issues, you might need to re-evaluate.
//    // For now, remove this method if it causes compilation issues without an adapter.
//    /*
//    protected boolean sameOriginDisabled() {
//        return true;
//    }
//    */
//}
