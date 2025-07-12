// Global variables
let ws;
let currentUser;
let selectedImage = null;

// On pressing Connect this method will be called
function connect() {
  ws = new WebSocket("ws://localhost:8080/hello");

  // Connection opened
  ws.onOpen = function(e) {
    console.log("Connection established");
  };

  // This function will be called every time a new message arrives
  ws.onMessage = function (e) {
    console.log("Message received:", e.data);
    printMessage(e.data);
  };

  // Handle connection errors
  ws.onError = function(e) {
    console.error("WebSocket error:", e);
  };

  // Handle disconnection
  ws.onClose = function(e) {
    console.log("Connection closed:", e);
  };

  document.getElementById("connectButton").disabled = true;
  document.getElementById("connectButton").value = "Connected";
  document.getElementById("name").disabled = true;

  currentUser = document.getElementById("name").value;
  console.log("Connected as:", currentUser);
}

// This function takes care of printing the message on browser
function printMessage(data) {
  let messages = document.getElementById("messages");
  let messageData = JSON.parse(data);

  let messageContainer = document.createElement("div");
  messageContainer.className = "message-container incoming-message";

  let nameSpan = document.createElement("div");
  nameSpan.className = "font-weight-bold";
  nameSpan.textContent = messageData.name;
  messageContainer.appendChild(nameSpan);

  // Show text message if present
  if (messageData.message && messageData.message.trim() !== "") {
    let messageText = document.createElement("div");
    messageText.textContent = messageData.message;
    messageContainer.appendChild(messageText);
  }

  // Show image if present
  if (messageData.url) {
    let image = document.createElement("img");
    image.src = messageData.url;
    image.className = "message-image mt-2";
    image.alt = "Shared image";
    messageContainer.appendChild(image);
  }

  messages.appendChild(messageContainer);

  // Scroll to bottom
  messages.scrollTop = messages.scrollHeight;
}

// Handle image selection from file input
function handleImageSelection() {
  const fileInput = document.getElementById("imageInput");

  if (fileInput.files && fileInput.files[0]) {
    selectedImage = fileInput.files[0];
    showImagePreview(selectedImage);
  }
}

// Show image preview for selected or pasted image
function showImagePreview(imageFile) {
  const previewContainer = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");

  // Show preview
  const reader = new FileReader();
  reader.onLoad = function(e) {
    previewImg.src = e.target.result;
    previewContainer.style.display = "flex";
  };
  reader.readAsDataURL(imageFile);

  // Enable send button
  toggleSendButton();
}

// Cancel image upload
function cancelImageUpload() {
  selectedImage = null;
  document.getElementById("imageInput").value = "";
  document.getElementById("imagePreview").style.display = "none";
  toggleSendButton();
}

// Upload image and send message
function uploadImage(callback) {
  if (!selectedImage) {
    if (callback) callback(null);
    return;
  }

  const formData = new FormData();
  formData.append("image", selectedImage);

  fetch("/api/upload", {
    method: "POST",
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.url) {
      if (callback) callback(data.url);

      // Reset image selection after successful send
      selectedImage = null;
      document.getElementById("imageInput").value = "";
      document.getElementById("imagePreview").style.display = "none";
    } else {
      console.error("Upload failed:", data.error);
      alert("Failed to upload image: " + data.error);
      if (callback) callback(null);
    }
  })
  .catch(error => {
    console.error("Error uploading image:", error);
    alert("Error uploading image");
    if (callback) callback(null);
  });
}

// This function handles functionality of sending the message to websocket
function sendToGroupChat() {
  if (ws === undefined || ws.readyState !== WebSocket.OPEN) {
    alert("Not connected to chat");
    return;
  }

  const messageText = document.getElementById("message").value.trim();
  const name = document.getElementById("name").value;

  // If there's no text and no image, don't send
  if (!messageText && !selectedImage) return;

  // If there's a selected image, upload it first
  if (selectedImage) {
    uploadImage(function(imageUrl) {
      // Create message object with both text and image url (if present)
      const messageObject = {
        name: name,
        message: messageText,
        url: imageUrl
      };

      // Show our message in the chat
      displayOutgoingMessage(messageText, imageUrl);

      // Send via WebSocket
      ws.send(JSON.stringify(messageObject));

      // Clear text input
      document.getElementById("message").value = "";
      toggleSendButton();
    });
  } else {
    // Text-only message
    const messageObject = {
      name: name,
      message: messageText
    };

    // Show our message in the chat
    displayOutgoingMessage(messageText, null);

    // Send via WebSocket
    ws.send(JSON.stringify(messageObject));

    // Clear text input
    document.getElementById("message").value = "";
    toggleSendButton();
  }
}

// Display outgoing message in the chat
function displayOutgoingMessage(text, imageUrl) {
  let messageContainer = document.createElement("div");
  messageContainer.className = "message-container outgoing-message";

  let nameSpan = document.createElement("div");
  nameSpan.className = "font-weight-bold";
  nameSpan.textContent = "You";
  messageContainer.appendChild(nameSpan);

  // Add text if present
  if (text && text.trim() !== "") {
    let messageContent = document.createElement("div");
    messageContent.textContent = text;
    messageContainer.appendChild(messageContent);
  }

  // Add image if present
  if (imageUrl) {
    let image = document.createElement("img");
    image.src = imageUrl;
    image.className = "message-image mt-2";
    image.alt = "Your shared image";
    messageContainer.appendChild(image);
  }

  document.getElementById("messages").appendChild(messageContainer);

  // Scroll to bottom
  const messages = document.getElementById("messages");
  messages.scrollTop = messages.scrollHeight;
}

// Enable/disable send button based on whether there's a message or image
function toggleSendButton() {
  const messageText = document.getElementById("message").value.trim();
  document.getElementById("send").disabled = !messageText && !selectedImage;
}

// Initialize clipboard paste handling
document.addEventListener('DOMContentLoaded', function() {
  // Set up paste event listener on the message textarea
  const messageInput = document.getElementById('message');

  messageInput.addEventListener('paste', function(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    // Look for image items in the clipboard data
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // Prevent default paste behavior for images

          // Get the image file from clipboard
          const blob = items[i].getAsFile();
          selectedImage = blob;

          // Show image preview
          showImagePreview(blob);

          break;
        }
      }
    }
  });

  // Enable global paste anywhere in the window
  document.addEventListener('paste', function(e) {
    // Only handle if the active element is not the message input
    // (since that's already handled above)
    if (document.activeElement !== messageInput) {
      const clipboardData = e.clipboardData || window.clipboardData;
      const items = clipboardData.items;

      // Look for image items in the clipboard data
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault(); // Prevent default paste behavior

            // Get the image file from clipboard
            const blob = items[i].getAsFile();
            selectedImage = blob;

            // Show image preview
            showImagePreview(blob);

            // Focus the message input so user can add text if desired
            messageInput.focus();

            break;
          }
        }
      }
    }
  });
});