package com.example.HashChatBackend.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Embeddable //marks a class whose fields should be part of the entity's table, not a separate table.
@Data // Generates getters, setters, equals, hashCode, toString
@NoArgsConstructor
@AllArgsConstructor
public class UserRoomMembershipId implements Serializable {

    private static final long serialVersionUID = 1L; // Recommended for Serializable

    // Corresponds to the 'id' of your PostgreSQL User entity
    private Long userId;

    // Corresponds to the '_id' (String) of your MongoDB Room document
    private String roomMongoId;

    // IMPORTANT: Equals and hashCode are crucial for composite keys
    // Lombok's @Data handles this, but explicitly implementing if not using Lombok
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserRoomMembershipId that = (UserRoomMembershipId) o;
        return Objects.equals(userId, that.userId) &&
                Objects.equals(roomMongoId, that.roomMongoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, roomMongoId);
    }
}