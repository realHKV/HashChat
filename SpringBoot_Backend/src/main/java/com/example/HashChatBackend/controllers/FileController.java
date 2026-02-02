package com.example.HashChatBackend.controllers;

import com.example.HashChatBackend.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for handling file uploads
 */
@Controller
public class FileController {

    @Autowired
    private CloudinaryService cloudinaryService; // Inject CloudinaryService

    // Remove local storage constants, no longer needed
    // private static final String UPLOAD_DIR = "uploads";
    // private static final long MAX_FILE_SIZE = 8 * 1024 * 1024;
    // private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"};

    /**
     * Handles image file uploads to Cloudinary
     *
     * @param file The image file to be uploaded
     * @return JSON response with file details
     */
    @PostMapping("/api/v1/upload")
    @ResponseBody
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("image") MultipartFile file) {
        Map<String, String> response = new HashMap<>();

        // Basic validation (Cloudinary also handles some of this, but good to have client-side checks)
        if (file.isEmpty()) {
            response.put("error", "Please select a file to upload");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        // You can add file size and type checks here if you want to fail fast before sending to Cloudinary
        // However, Cloudinary has its own limits and transformations.
        // For example, if you want a 5MB limit before upload:
        // if (file.getSize() > 5 * 1024 * 1024) {
        //     response.put("error", "File size exceeds maximum limit (5MB)");
        //     return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        // }
        // For allowed extensions:
        // String originalFilename = file.getOriginalFilename();
        // String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        // boolean isAllowedExtension = false;
        // for (String ext : new String[]{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}) {
        //     if (fileExtension.equals(ext)) {
        //         isAllowedExtension = true;
        //         break;
        //     }
        // }
        // if (!isAllowedExtension) {
        //     response.put("error", "Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed");
        //     return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        // }


        try {
            String fileUrl = cloudinaryService.uploadFile(file, "chat-images"); // Upload to "chat-images" folder
            String originalFilename = file.getOriginalFilename();
            long fileSize = file.getSize();

            // Return success response with file URL
            response.put("url", fileUrl);
            // Cloudinary provides public_id, but for your current frontend, you might just need the URL.
            // If you need filename, you can extract it from the URL or get it from Cloudinary's upload result.
            // For simplicity, we are just returning the URL.
            response.put("filename", cloudinaryService.extractPublicId(fileUrl)); // Using public ID as filename
            response.put("originalFilename", originalFilename);
            response.put("size", String.valueOf(fileSize));

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IOException e) {
            response.put("error", "Failed to upload file to Cloudinary: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
//api/upload endpoint returns a response map containing error if error , or imgurl,filename,size,originalFilename ,
//which is converted to json by springboot automatically