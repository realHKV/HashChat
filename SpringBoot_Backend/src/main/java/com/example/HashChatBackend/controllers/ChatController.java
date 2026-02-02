package com.example.HashChatBackend.controllers;


import com.example.HashChatBackend.model.Message;
import com.example.HashChatBackend.model.MessageRequest;
import com.example.HashChatBackend.model.Room;
import com.example.HashChatBackend.repository.UserRepo;
import com.example.HashChatBackend.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;

@Controller
//@CrossOrigin("http:/localhost:5173")
public class ChatController {
    @Autowired
    private RoomService roomService;

    @Autowired
    private UserRepo userRepository;

    //for sending and receiving messages
    @MessageMapping("/sendMessage/{roomId}") // /app/sendMessage/roomId
    @SendTo("/topic/room/{roomId}") //subscribe
    public Message sendMessage(
            @DestinationVariable String roomId,
            @RequestBody MessageRequest request
    ){
        Room room = roomService.getRoomByRoomId(request.getRoomId());

        Message message = new Message();

        message.setSender(request.getSender());
        message.setSenderId(request.getSenderId());
        message.setContent(request.getContent());
        message.setImageUrl(request.getImageUrl());
        message.setTimeStamp(LocalDateTime.now());

        if(room!=null){
            room.getMessages().add(message);
            roomService.saveRoom(room);
        }else{
            throw new RuntimeException("Room not found");
        }

        return message;
    }
}
