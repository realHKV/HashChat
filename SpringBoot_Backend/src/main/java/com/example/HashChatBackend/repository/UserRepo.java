package com.example.HashChatBackend.repository;

import com.example.HashChatBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token);
//    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
//    boolean existsByUsername(String username);
}