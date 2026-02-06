package com.example.HashChatBackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_room_memberships") // Name of your junction table in PostgreSQL
@Data // Generates getters, setters, equals, hashCode, toString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoomMembership {

    // Embeddable composite primary key
    @EmbeddedId
    private UserRoomMembershipId id;


    // Additional fields for the relationship
    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @UpdateTimestamp // This annotation will automatically update the timestamp on every update
    @Column(name = "last_visited_at", nullable = false)
    private LocalDateTime lastVisitedAt;

    // Define the relationship to User using @MapsId to link it to the composite key component
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") // This tells JPA that the 'userId' component of the @EmbeddedId maps to this 'User' entity.
    // It expects a field named 'userId' in UserRoomMembershipId.
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false) // 'name' is the column in THIS table (user_room_memberships), 'referencedColumnName' is in the User table
    private User user;



    public Long getUserId() {
        return id != null ? id.getUserId() : null;
    }

    public String getRoomMongoId() {
        return id != null ? id.getRoomMongoId() : null;
    }

    // You cannot directly map to a MongoDB Room entity with @ManyToOne here.
    // The link to Room is purely via roomMongoId (accessed via id.getRoomMongoId()).
}