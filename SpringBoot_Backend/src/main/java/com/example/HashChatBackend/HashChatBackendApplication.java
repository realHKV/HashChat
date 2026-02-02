package com.example.HashChatBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HashChatBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HashChatBackendApplication.class, args);
	}

}
