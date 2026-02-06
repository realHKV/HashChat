package com.example.HashChatBackend.controllers;

import com.example.HashChatBackend.model.Message;
import com.example.HashChatBackend.model.MessageRequest;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controller for handling global chat messages.
 * Global chat is accessible to both authenticated users and guest users.
 * Messages are only persisted in memory while users are connected.
 */
@Controller
public class GlobalChatController {

    /**
     * Handle global chat messages from both guests and authenticated users.
     * The message itself contains all necessary sender info (name, photo).
     */
    @MessageMapping("/global/sendMessage")
    @SendTo("/topic/global")
    public Message sendGlobalMessage(@RequestBody MessageRequest request) {

        // Create message object to broadcast
        Message message = new Message();
        message.setSender(request.getSender());
        message.setSenderId(request.getSenderId());
        message.setContent(request.getContent());
        // Store profile pic URL in imageUrl field so guests can see it
        message.setImageUrl(request.getImageUrl());
        message.setTimeStamp(LocalDateTime.now());

        return message;
    }
}