package com.example.ChatAppWebSocketdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class ChatAppWebSocketdemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChatAppWebSocketdemoApplication.class, args);
	}

}
