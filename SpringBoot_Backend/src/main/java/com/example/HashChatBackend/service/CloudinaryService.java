package com.example.HashChatBackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(@Value("${cloudinary.cloud_name}") String cloudName,
                             @Value("${cloudinary.api_key}") String apiKey,
                             @Value("${cloudinary.api_secret}") String apiSecret) {
        Map config = ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
//                "secure", true  // Use HTTPS for secure connections
        );
        cloudinary = new Cloudinary(config);
    }

    /**
     * Uploads a MultipartFile to Cloudinary.
     *
     * @param file The MultipartFile to upload.
     * @param folder The folder in Cloudinary to upload the image to (e.g., "profile_pics", "chat_images").
     * @return The secure URL of the uploaded image.
     * @throws IOException if there's an issue with file input stream.
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", folder));
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Deletes an image from Cloudinary using its public ID.
     *
     * @param publicId The public ID of the image to delete.
     * @throws IOException if there's an issue with the Cloudinary API call.
     */
    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    /**
     * Extracts the public ID from a Cloudinary URL.
     * Cloudinary URLs are typically in the format:
     * .../upload/v<version>/<folder>/<public_id>.<extension>
     *
     * @param imageUrl The full Cloudinary image URL.
     * @return The public ID of the image, or null if it cannot be extracted.
     */
    public String extractPublicId(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }
        // Example URL: https://res.cloudinary.com/your_cloud_name/image/upload/v123456789/folder/image_public_id.jpg
        int lastSlashIndex = imageUrl.lastIndexOf('/');
        int lastDotIndex = imageUrl.lastIndexOf('.');
        if (lastSlashIndex != -1 && lastDotIndex != -1 && lastDotIndex > lastSlashIndex) {
            String filenameWithExtension = imageUrl.substring(lastSlashIndex + 1);
            return filenameWithExtension.substring(0, filenameWithExtension.lastIndexOf('.'));
        }
        return null;
    }
}
