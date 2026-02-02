package com.example.HashChatBackend.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
//@CrossOrigin("http://localhost:5173")
public class PingController {
    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
