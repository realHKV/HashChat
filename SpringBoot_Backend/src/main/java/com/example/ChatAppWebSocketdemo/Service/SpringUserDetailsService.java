package com.example.ChatAppWebSocketdemo.Service;

import com.example.ChatAppWebSocketdemo.Model.User;
import com.example.ChatAppWebSocketdemo.Repository.UserRepo;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Collections; // For simple authorities, you might use a more complex authority model

@Service // Mark this as a Spring service
public class SpringUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepo userRepository; // Inject your UserRepo

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Use your existing repository method to find the user by email
        User user = userRepository.findByEmail(email) // Assuming 'User' is your entity
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Return a Spring Security User object
        // The password field here is necessary for UserDetails, even if you're not
        // using it directly for password comparison during JWT authentication.
        // Replace 'Collections.emptyList()' with actual roles/authorities if your User entity has them.
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(), // This should be the HASHED password from your database
                Collections.emptyList() // Or list of granted authorities/roles for the user
        );
    }
}