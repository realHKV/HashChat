package com.example.HashChatBackend.service;

import com.example.HashChatBackend.model.Room;
import com.example.HashChatBackend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    public Room getRoomByRoomId(String roomId){
        return roomRepository.findByRoomId(roomId);
    }

    public Room saveRoom(Room room){
        return roomRepository.save(room);
    }
}
