package com.example.ChatAppWebSocketdemo.Controller;

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

    // Directory where uploaded files will be stored
    private static final String UPLOAD_DIR = "uploads";

    // Maximum file size (8MB)
    private static final long MAX_FILE_SIZE = 8 * 1024 * 1024;

    // Allowed file types
    private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"};

    /**
     * Handles image file uploads
     *
     * @param file The image file to be uploaded
     * @return JSON response with file details
     */
    @PostMapping("/api/upload")
    @ResponseBody
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("image") MultipartFile file) {
        Map<String, String> response = new HashMap<>();

        // Check if file is empty
        if (file.isEmpty()) {
            response.put("error", "Please select a file to upload");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            response.put("error", "File size exceeds maximum limit (5MB)");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        // Check file type
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        boolean isAllowedExtension = false;

        for (String ext : ALLOWED_EXTENSIONS) {
            if (fileExtension.equals(ext)) {
                isAllowedExtension = true;
                break;
            }
        }

        if (!isAllowedExtension) {
            response.put("error", "Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        try {
            // Create uploads directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdir();
            }

            // Generate unique filename
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = Paths.get(UPLOAD_DIR, newFilename);
            Files.copy(file.getInputStream(), filePath);

            // Generate URL for accessing the file
            String fileUrl = "/uploads/" + newFilename;

            // Return success response with file URL
            response.put("url", fileUrl);
            response.put("filename", newFilename);
            response.put("originalFilename", originalFilename);
            response.put("size", String.valueOf(file.getSize()));

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IOException e) {
            response.put("error", "Failed to upload file: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
//api/upload endpoint returns a response map containing error if error , or imgurl,filename,size,originalFilename ,
//which is converted to json by springboot automatically