package com.example.HashChatBackend.repository;

import com.example.HashChatBackend.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room,String> {

    //get room using roomId
    Room findByRoomId(String roomId); //make it Optional<> ?
}
