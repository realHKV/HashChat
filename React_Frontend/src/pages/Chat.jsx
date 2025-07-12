import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Send, Upload, ArrowLeft, User, Smile, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Chat= ()=>{
    const {user} = useAuth();
    const navigate = useNavigate();
  
  // Chat states
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // API Base URL
  const API_BASE = 'http://localhost:8080';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    if (user) {
      connectToWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user]);

  // WebSocket connection function
  const connectToWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8080/hello');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        toast.success('Connected to chat!');
        
        // Send join message with user info
        const joinMessage = {
          type: 'user_join',
          sender: user.username || user.name || 'Anonymous',
          userId: user.id,
          profilePic: user.profilePicUrl,
          timestamp: new Date().toISOString()
        };
        
        setTimeout(() => {
          ws.send(JSON.stringify(joinMessage));
        }, 100);
      };
      
      ws.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          
          // Handle different message types
          switch (messageData.type) {
            case 'user_join':
              if (messageData.userId !== user.id) {
                toast(`${messageData.sender} joined the chat`, {
                  icon: '👋',
                  duration: 2000
                });
              }
              break;
              
            case 'user_leave':
              if (messageData.userId !== user.id) {
                toast(`${messageData.sender} left the chat`, {
                  icon: '👋',
                  duration: 2000
                });
              }
              break;
              
            case 'typing_start':
              if (messageData.userId !== user.id) {
                setTypingUsers(prev => new Set([...prev, messageData.sender]));
              }
              break;
              
            case 'typing_stop':
              if (messageData.userId !== user.id) {
                setTypingUsers(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(messageData.sender);
                  return newSet;
                });
              }
              break;
              
            case 'online_count':
              setOnlineUsers(messageData.count);
              break;
              
            default:
              // Regular message
              setMessages(prev => [...prev, {
                ...messageData,
                isOwn: messageData.userId === user.id
              }]);
              break;
          }
        } catch (err) {
          // Handle plain text messages for backwards compatibility
          console.log('Received plain text message:', event.data);
          setMessages(prev => [...prev, { 
            content: event.data, 
            sender: 'System',
            timestamp: new Date().toISOString(),
            type: 'text',
            isOwn: false
          }]);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        toast.error('Disconnected from chat');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!socket || socket.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect...');
            connectToWebSocket();
          }
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error');
      };
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      toast.error('Failed to connect to chat server');
    }
  };

  // Send regular text message
  const sendMessage = () => {
    if (!socket || !messageInput.trim() || !isConnected) return;

    const messageData = {
      content: messageInput.trim(),
      sender: user.username || user.name || 'Anonymous',
      userId: user.id,
      profilePic: user.profilePicUrl,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    socket.send(JSON.stringify(messageData));
    
    // Add to local messages with isOwn flag
    setMessages(prev => [...prev, { ...messageData, isOwn: true }]);
    setMessageInput('');
    
    // Stop typing indicator
    handleStopTyping();
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !isConnected) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.send(JSON.stringify({
        type: 'typing_start',
        sender: user.username || user.name || 'Anonymous',
        userId: user.id,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && socket && isConnected) {
      setIsTyping(false);
      socket.send(JSON.stringify({
        type: 'typing_stop',
        sender: user.username || user.name || 'Anonymous',
        userId: user.id,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return `${API_BASE}${result.url}`;
      } else {
        const error = await response.json();
        toast.error(`Upload failed: ${error.error || 'Unknown error'}`);
        return null;
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedImage || !socket || !isConnected) return;

    toast.loading('Uploading image...');
    
    const imageUrl = await uploadImage(selectedImage);
    toast.dismiss();
    
    if (imageUrl) {
      const messageData = {
        content: imageUrl,
        sender: user.username || user.name || 'Anonymous',
        userId: user.id,
        profilePic: user.profilePicUrl,
        timestamp: new Date().toISOString(),
        type: 'image'
      };

      socket.send(JSON.stringify(messageData));
      setMessages(prev => [...prev, { ...messageData, isOwn: true }]);
      toast.success('Image sent!');
    }
    
    // Clear selected image
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (8MB limit)
      if (file.size > 8 * 1024 * 1024) {
        toast.error('Image size should be less than 8MB');
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format typing users
  const getTypingText = () => {
    const typingArray = Array.from(typingUsers);
    if (typingArray.length === 0) return '';
    if (typingArray.length === 1) return `${typingArray[0]} is typing...`;
    if (typingArray.length === 2) return `${typingArray[0]} and ${typingArray[1]} are typing...`;
    return `${typingArray[0]} and ${typingArray.length - 1} others are typing...`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
              {user?.profilePicUrl ? (
                <img 
                  src={user.profilePicUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            
            <div>
              <h1 className="font-semibold text-gray-900">Hash Chat</h1>
              <p className="text-sm text-gray-500">
                {isConnected ? (
                  onlineUsers > 0 ? `${onlineUsers} online` : 'Connected'
                ) : (
                  'Connecting...'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium">Welcome to Hash Chat!</p>
            <p className="text-sm">Start a conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2`}
            >
              {/* Profile picture for others' messages */}
              {!message.isOwn && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                  {message.profilePic ? (
                    <img 
                      src={message.profilePic} 
                      alt={message.sender} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500 m-2" />
                  )}
                </div>
              )}
              
              {/* Message bubble */}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.isOwn
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                }`}
              >
                {/* Sender name for received messages */}
                {!message.isOwn && (
                  <p className="text-xs font-semibold mb-1 text-blue-600">
                    {message.sender}
                  </p>
                )}
                
                {/* Message content */}
                {message.type === 'image' ? (
                  <div className="space-y-2">
                    <img
                      src={message.content}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => window.open(message.content, '_blank')}
                    />
                  </div>
                ) : (
                  <p className="break-words">{message.content}</p>
                )}
                
                {/* Timestamp */}
                <p className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start items-center space-x-2">
            <div className="bg-gray-200 rounded-full px-4 py-2">
              <div className="flex space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500">{getTypingText()}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-3 bg-gray-100 border-t">
          <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedImage?.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={sendImageMessage}
                disabled={!isConnected}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center space-x-3">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            title="Upload image"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {/* Message input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
            />
          </div>
          
          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!isConnected || !messageInput.trim()}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Chat;