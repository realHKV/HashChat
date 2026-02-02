package com.example.HashChatBackend.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    private String SenderId;
    private String Sender;
    private String Content;
    private String ImageUrl;
//    private String SenderProfilePicURL;
    private LocalDateTime TimeStamp;

    public Message(String sender,String  content,String senderId,String imageUrl) {
        Sender = sender;
        Content = content;
        SenderId = senderId;
        ImageUrl= imageUrl;
//        SenderProfilePicURL = senderProfilePicURL;
        TimeStamp = LocalDateTime.now();
    }
}
