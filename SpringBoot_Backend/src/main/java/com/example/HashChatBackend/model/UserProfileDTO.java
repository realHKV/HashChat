package com.example.HashChatBackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String email;
//    private String username;
    private String name;
    private String description;
    private String profilePicUrl;
}
