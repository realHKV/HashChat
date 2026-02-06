package com.example.HashChatBackend.model;

import com.example.HashChatBackend.service.CustomUserDetailsService;
import com.example.HashChatBackend.utils.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Inside doFilterInternal method
        String requestPath = request.getRequestURI();

        // 1. Allow WebSocket handshake without token
        if (requestPath.startsWith("/chat")) {
            filterChain.doFilter(request, response);
            return;
        }

        // IMPORTANT: Skip JWT processing for OPTIONS requests (CORS preflight)
        if (HttpMethod.OPTIONS.name().equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return; // Exit the filter chain for OPTIONS requests
        }

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7); // Extract the token
            try {
                username = jwtUtil.getEmailFromToken(jwt); // Extract username (email) from token
            } catch (ExpiredJwtException e) {
                System.err.println("JWT Token is expired: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
                response.getWriter().write("{\"error\": \"JWT Token is expired\"}"); // Send JSON error
                return; // STOP here if token is expired
            } catch (MalformedJwtException | SignatureException | IllegalArgumentException e) {
                System.err.println("Invalid JWT Token: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
                response.getWriter().write("{\"error\": \"Invalid JWT Token\"}"); // Send JSON error
                return; // STOP here if token is malformed/invalid
            } catch (Exception e) {
                // Catch any other unexpected exception during token parsing
                System.err.println("Unexpected error processing JWT Token: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500 Internal Server Error
                response.getWriter().write("{\"error\": \"Internal server error processing token\"}");
                return; // STOP here for unexpected errors
            }
        } else {
            // Log if no Authorization header or not starting with "Bearer "
            // For endpoints that require authentication, this would eventually lead to a 403/401
             System.out.println("No JWT token found in request headers for " + request.getRequestURI());
        }

        // If username is found and no authentication is currently set in SecurityContext
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = null;
            try {
                userDetails = this.userDetailsService.loadUserByUsername(username);
            } catch (UsernameNotFoundException e) {
                System.err.println("User '" + username + "' not found from token subject.");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
                response.getWriter().write("{\"error\": \"User not found from token\"}");
                return; // STOP if user does not exist
            } catch (Exception e) {
                // Catch any other errors from UserDetailsService (e.g., database issues)
                System.err.println("Error loading user details for " + username + ": " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500 Internal Server Error
                response.getWriter().write("{\"error\": \"Error loading user details\"}");
                return;
            }


            // Validate the token against the user details
            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // Set the authentication in the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                // System.out.println("User '" + username + "' successfully authenticated and context set.");
            } else {
                System.err.println("JWT Token validation failed for user: " + username + " (token may not match user details)");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
                response.getWriter().write("{\"error\": \"Invalid JWT token for user\"}");
                return; // STOP if token validation fails
            }
        }

        // Continue the filter chain. If authentication was not set,
        // subsequent security filters (like anyRequest().authenticated()) will handle it.
        filterChain.doFilter(request, response);
    }
}