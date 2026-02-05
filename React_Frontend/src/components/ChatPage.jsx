import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdAttachFile, MdSend ,MdMenu} from 'react-icons/md'
import { useChatContext } from '../context/ChatContext'
import { BASE_URL } from '../config/AxiosHelper';
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { getMessagess, getPastRoomUsersApi } from '../services/RoomService';
import { timeAgo } from '../config/helper';
import { useAuth } from '../context/AuthContext';
import UserSideBar from './UserSideBar';
import ImagePreviewModal from './ImagePreviewModal';


const ChatPage = () => {
    const {
        roomId,
        connected,
        setConnected,
        setRoomId,
    } = useChatContext();

    const { token, userProfile, loadingAuth, logout } = useAuth();
    const navigate = useNavigate();

    const [connectedUsers, setConnectedUsers] = useState([]);
    const [allDisplayableUserProfiles, setAllDisplayableUserProfiles] = useState([]);
    const [pastRoomUsers, setPastRoomUsers] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Changed to true
    // Removed: const [leavingRoom, setLeavingRoom] = useState(false); // No longer needed

    const prevConnectedUsersRef = useRef([]);
    //Ref for the message input container
    const messageInputContainerRef = useRef(null);
    //State to store the dynamic height of the message input container
    const [messageInputHeight, setMessageInputHeight] = useState('5rem');

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const inputRef = useRef(null);
    const ChatBoxRef = useRef(null);

    // Use useRef for stompClient to avoid it being a dependency that triggers re-renders
    const stompClientRef = useRef(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Memoize sender colors
    const senderColors = useMemo(() => {
        const colors = {};
        const availableColors = [
            'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400',
            'text-purple-400', 'text-pink-400', 'text-indigo-400', 'text-teal-400'
        ]; // Add more if needed

        let colorIndex = 0;
        return (senderEmail) => {
            if (!colors[senderEmail]) {
                colors[senderEmail] = availableColors[colorIndex % availableColors.length];
                colorIndex++;
            }
            return colors[senderEmail];
        };
    }, []);

    // Redirect if not connected to a room (removed leavingRoom check and toast)
    useEffect(() => {
        if (loadingAuth) {
            return;
        }
        if (!connected || !roomId || !userProfile || !token) {
            // This useEffect now only handles redirection if prerequisites are not met
            // It will no longer show a toast for intentional leaves.
            navigate("/");
        }
    }, [connected, roomId, userProfile, token, navigate, loadingAuth]);

    //Effect to measure and update input container height dynamically
    useEffect(() => {
        if (messageInputContainerRef.current) {
            const timeoutId = setTimeout(() => {
                const height = messageInputContainerRef.current.offsetHeight;
                setMessageInputHeight(`${height}px`);
            }, 0);

            return () => clearTimeout(timeoutId);
        }
    }, [selectedImage, isSidebarOpen, input]); // Added input as dependency for height adjustment


    // Load messages when connected or roomId changes
    useEffect(() => {
        async function loadMessages() {
            if (!roomId) return;

            try {
                const fetchedMessages = await getMessagess(roomId);
                // console.log("Fetched messages:", fetchedMessages);
                setMessages(fetchedMessages);
            } catch (error) {
                console.error("Error loading messages:", error);
                toast.error("Failed to load messages.");
            }
        }
        if (connected && roomId) {
            loadMessages();
        }
    }, [connected, roomId]);

    // Scroll to bottom of chat box
    useEffect(() => {
        if (ChatBoxRef.current) {
            ChatBoxRef.current.scroll({
                top: ChatBoxRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const fetchPastRoomUsers = useCallback(async (currentRoomId) => {
        if (!currentRoomId) {
            console.warn("No room ID provided to fetch past room users.");
            return;
        }
        try {
            // console.log("Fetching past room users for room ID:", currentRoomId);
            const users = await getPastRoomUsersApi(currentRoomId);
            const usersMap = users.reduce((acc, user) => {
                acc[user.id] = user;
                acc[user.email] = user;
                return acc;
            }, {});
            setPastRoomUsers(prev => {
                if (JSON.stringify(prev) === JSON.stringify(usersMap)) {
                    return prev;
                }
                return usersMap;
            });
            // console.log("Processed past room users map:", usersMap);
        } catch (error) {
            console.error("Failed to fetch past room users:", error);
            toast.error("Failed to load historical user data for this room.");
        }
    }, []);

    const uniqueUserEmailsForSidebar = useMemo(() => {
        const emails = new Set();
        connectedUsers.forEach(user => {
            if (user.email) {
                emails.add(user.email);
            }
        });
        Object.values(pastRoomUsers).forEach(user => {
            if (user.email) {
                emails.add(user.email);
            }
        });
        if (userProfile?.email) {
            emails.add(userProfile.email);
        }
        return Array.from(emails);
    }, [connectedUsers, pastRoomUsers, userProfile]);

    // Initialize and connect STOMP client
    useEffect(() => {
        if (isConnecting || (stompClientRef.current && stompClientRef.current.connected)) {
            console.log("WebSocket connection already in progress or connected. Skipping.");
            return;
        }

        if (!connected || !roomId || !token || loadingAuth || !userProfile) {
            console.log("Not ready to connect WebSocket. Missing prerequisites:", {
                connected,
                roomId,
                token: token ? "present" : "absent",
                loadingAuth,
                userProfile: userProfile ? "present" : "absent"
            });
            return;
        }

        console.log("Attempting to connect WebSocket...");
        setIsConnecting(true);

        const sock = new SockJS(`${BASE_URL}/chat`);
        const client = Stomp.over(sock);

        client.debug = (str) => {
            if (str.includes('>>> PING') || str.includes('<<< PONG')) return;
        };

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        client.connect(headers, () => {
            console.log("STOMP Connected!");
            stompClientRef.current = client;
            toast.success("Connected to chat server!");
            setIsConnecting(false);

            // Subscribe to messages
            client.subscribe(`/topic/room/${roomId}`, (message) => {
                // console.log("Received message:", message);
                const newMessage = JSON.parse(message.body);
                setMessages((prev) => [...prev, newMessage]);
            }, (error) => {
                console.error("STOMP subscription error for messages:", error);
                toast.error("Lost connection to chat. Please refresh.");
            });

            // Subscribe to active users
            client.subscribe(`/topic/room/${roomId}/activeUsers`, (message) => {
                const receivedUsers = JSON.parse(message.body);
                // console.log(`Active users in room ${roomId}:`, receivedUsers);

                const prevUsers = prevConnectedUsersRef.current;
                const newUsers = receivedUsers;

                const prevEmails = new Set(prevUsers.map(u => u.email));
                const newEmails = new Set(newUsers.map(u => u.email));

                const joinedUsers = newUsers.filter(u => !prevEmails.has(u.email));
                joinedUsers.forEach(user => {
                    if (prevUsers.length > 0 && user.email !== userProfile.email) {
                        const userName = user.name || user.email.split('@')[0];
                        toast.success(`${userName} joined the room!`);
                    }
                });

                const leftUsers = prevUsers.filter(u => !newEmails.has(u.email));
                leftUsers.forEach(user => {
                    if (user.email !== userProfile.email) {
                        const userName = user.name || user.email.split('@')[0];
                        toast.error(`${userName} left the room.`);
                    }
                });

                prevConnectedUsersRef.current = newUsers;
                setConnectedUsers(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(newUsers)) {
                        return prev;
                    }
                    return newUsers;
                });

                setPastRoomUsers(prev => {
                    const newPastUsers = { ...prev };
                    newUsers.forEach(user => {
                        if (user.id && user.email && user.name && (user.profilePicUrl !== undefined)) {
                            if (!newPastUsers[user.email] || (user.profilePicUrl && !newPastUsers[user.email].profilePicUrl)) {
                                newPastUsers[user.email] = user;
                            }
                        }
                    });
                    if (JSON.stringify(prev) === JSON.stringify(newPastUsers)) {
                        return prev;
                    }
                    return newPastUsers;
                });
            }, (error) => {
                console.error("STOMP active users subscription error:", error);
            });

            // Subscribe to profile updates
            client.subscribe(`/topic/profileUpdates`, (message) => {
                try {
                    const { email: updatedUserEmail } = JSON.parse(message.body);
                    // console.log(`Received real-time profile update notification for: ${updatedUserEmail}`);
                    window.dispatchEvent(new CustomEvent('profileUpdated', {
                        detail: { email: updatedUserEmail }
                    }));
                } catch (e) {
                    console.error("Error parsing profile update notification:", e);
                }
            }, (error) => {
                console.error("STOMP profile updates subscription error:", error);
            });

            // Send JOIN message
            if (userProfile && roomId) {
                client.send(`/app/chat.addUser/${roomId}`, {}, JSON.stringify({
                    sender: userProfile.name,
                    senderId: userProfile.email, // Use email as senderId for consistent identification
                    profilePicUrl: userProfile.profilePicUrl,
                    roomId: roomId,
                    type: 'JOIN'
                }));
            }

        }, (error) => {
            console.error("STOMP connection error:", error);
            toast.error("Failed to connect to chat server.");
            setIsConnecting(false);
            stompClientRef.current = null;
        });

        // Cleanup function for WebSocket connection
        return () => {
            const currentClient = stompClientRef.current;
            if (currentClient && currentClient.connected) {
                console.log("Disconnecting STOMP client (cleanup).");
                if (userProfile && roomId) {
                    currentClient.send(`/app/chat.leaveUser/${roomId}`, {}, JSON.stringify({
                        sender: userProfile.name,
                        senderId: userProfile.email, // Use email as senderId for consistent identification
                        profilePicUrl: userProfile.profilePicUrl,
                        roomId: roomId,
                        type: 'LEAVE'
                    }));
                }
                currentClient.disconnect(() => {
                    console.log("STOMP client disconnected (cleanup callback).");
                    stompClientRef.current = null;
                    setIsConnecting(false);
                    prevConnectedUsersRef.current = [];
                    setConnectedUsers([]);
                });
            } else if (currentClient && !currentClient.connected) {
                console.log("STOMP client was not connected, skipping disconnect in cleanup.");
                stompClientRef.current = null;
                setIsConnecting(false);
            }
        };
    }, [connected, roomId, token, loadingAuth, userProfile, isConnecting]);


    //Fetch past room users on component mount and when room/user details are ready
    useEffect(() => {
        if (roomId && !loadingAuth && userProfile?.id) {
            fetchPastRoomUsers(roomId);
        }
    }, [roomId, loadingAuth, userProfile?.id, fetchPastRoomUsers]);


    // Callback function to receive profiles from UserSideBar
    const handleProfilesUpdate = useCallback((profiles) => {
        // console.log("Received profiles from UserSideBar:", profiles);
        setAllDisplayableUserProfiles(prev => {
            if (JSON.stringify(prev) === JSON.stringify(profiles)) {
                return prev;
            }
            return profiles;
        });
    }, []);

    // Helper function to get avatar for messages
    const getMessageAvatar = useCallback((message) => {
        const genericAvatarBaseUrl = "https://avatar.iran.liara.run/public/";

        // Prioritize specific userProfile if it's the current user
        if (message.senderId === userProfile?.email) {
            return userProfile?.profilePicUrl || `${genericAvatarBaseUrl}${userProfile?.email?.charCodeAt(0) % 100 || 0}`;
        }

        // Try to find in allDisplayableUserProfiles (fetched from sidebar or past users)
        const userProfileData = allDisplayableUserProfiles.find(profile =>
            profile.email === message.senderId
        );

        if (userProfileData?.profilePicUrl) {
            return userProfileData.profilePicUrl;
        }

        // Fallback to senderProfilePicUrl if available in the message itself
        if (message.senderProfilePicUrl) {
            return message.senderProfilePicUrl;
        }

        // Fallback to generic avatar based on senderId (email) or sender name
        return `${genericAvatarBaseUrl}${message.senderId?.charCodeAt(0) % 100 || message.sender?.charCodeAt(0) % 100 || 0}`;
    }, [allDisplayableUserProfiles, userProfile]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file.");
                setSelectedImage(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Image file size should not exceed 5MB.");
                setSelectedImage(null);
                return;
            }
            setSelectedImage(file);
        }
    };

    // Upload image
    const uploadImage = async () => {
        if (!selectedImage) {
            toast.error("No image selected to send.");
            return null;
        }

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await fetch(`${BASE_URL}/api/v1/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload image');
            }

            const result = await response.json();
            toast.success("Image uploaded successfully!");
            setSelectedImage(null);
            return result.url;
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error(`Image upload failed: ${error.message}`);
            setSelectedImage(null);
            return null;
        }
    };

    // Send message handler
    const sendMessage = async () => {
        if (!stompClientRef.current || !stompClientRef.current.connected) {
            toast.error("Not connected to chat. Please wait or refresh.");
            return;
        }

        let messageContent = input.trim();
        let imageUrl = null;

        if (selectedImage) {
            toast('Uploading image...', { icon: '⏳' });
            imageUrl = await uploadImage();
            if (!imageUrl) {
                return;
            }
            // If there's an image, allow empty caption
            // If no message content, set it to empty string so it's not null/undefined
            if (!messageContent) {
                messageContent = "";
            }
        } else if (!messageContent) { // Only check for empty content if no image is selected
            toast.error("Message cannot be empty.");
            return;
        }

        const message = {
            sender: userProfile.name,
            senderId: userProfile.email, // Use email for senderId
            content: messageContent,
            roomId: roomId,
            type: 'CHAT',
            imageUrl: imageUrl,
            senderProfilePicUrl: userProfile.profilePicUrl
        };

        stompClientRef.current.send(
            `/app/sendMessage/${roomId}`,
            {},
            JSON.stringify(message)
        );

        setInput("");
        setSelectedImage(null);
    };

    const handleEditProfile = () => {
        navigate('/profile');
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsSidebarOpen(false);
    };

    function handleRoomLeave() {
        // Removed: setLeavingRoom(true);
        if (stompClientRef.current && stompClientRef.current.connected) {
            console.log("STOMP client connected, sending LEAVE message.");
            if (userProfile && roomId) {
                stompClientRef.current.send(`/app/chat.leaveUser/${roomId}`, {}, JSON.stringify({
                    sender: userProfile.name,
                    senderId: userProfile.email, // Use email as senderId for consistent identification
                    profilePicUrl: userProfile.profilePicUrl,
                    roomId: roomId,
                    type: 'LEAVE'
                }));
                console.log("LEAVE message sent.");
            }
            stompClientRef.current.disconnect(() => {
                console.log("STOMP client disconnected callback during room leave.");
                stompClientRef.current = null;
                setIsConnecting(false);
                prevConnectedUsersRef.current = [];
                setConnectedUsers([]);
            });
        } else {
            console.log("STOMP client not connected, skipping LEAVE message and direct disconnect.");
            stompClientRef.current = null;
            setIsConnecting(false);
            prevConnectedUsersRef.current = [];
            setConnectedUsers([]);
        }

        setConnected(false);
        setRoomId("");
        navigate("/");
        toast("You have left the room.", { icon: '👋' });
        // Removed: setLeavingRoom(false);
    }

    const openImagePreview = (imageUrl) => {
        setPreviewImage(imageUrl);
    };

    const genericAvatarBaseUrl = "https://avatar.iran.liara.run/public/";

    // Function to render text with clickable links
    
    const renderMessageContent = useCallback((text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 underline hover:text-blue-200"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    }, [])

    // Add these variables/hooks at the top of your component
    const [touchStart, setTouchStart] = React.useState(null);
    const [touchEnd, setTouchEnd] = React.useState(null);

    // Minimum distance required to trigger a swipe
    const minSwipeDistance = 50; 

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
    
        // If user swipes left more than 50px, close the sidebar
        if (isLeftSwipe) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="h-screen dark:bg-gray-800 text-white">
            {/* Image Preview Modal */}
            <ImagePreviewModal
                src={previewImage}
                onClose={() => setPreviewImage(null)}
            />

            {/* Sidebar Container */}
            <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}    
            className={`
                fixed top-0 left-0 h-full bg-gray-900 dark:bg-gray-950 text-white
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                w-64 sm:w-72 lg:w-80
                overflow-hidden
                z-50 flex flex-col
            `}>
                {/* HASHCHAT title at the very top of the sidebar */}
                <div className="py-4 px-4 text-center bg-gray-900 dark:bg-gray-950 sticky top-0">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500">HASHCHAT</h2>
                </div>

                <div className="p-4 pt-4 flex-grow overflow-y-auto custom-scrollbar">
                    {/* Current User Profile Info */}
                    <div className="mb-4 text-center pb-4 border-b border-gray-700">
                        <img
                            src={userProfile?.profilePicUrl || `${genericAvatarBaseUrl}${userProfile?.email?.charCodeAt(0) % 100 || 0}`}
                            alt="Your Profile"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto object-cover border-2 border-rose-500 cursor-pointer"
                            onClick={() => openImagePreview(userProfile?.profilePicUrl || `${genericAvatarBaseUrl}${userProfile?.email?.charCodeAt(0) % 100 || 0}`)}
                        />
                        <h3 className="text-lg font-semibold mt-2 break-words">
                            {userProfile?.name || "Guest User"}
                        </h3>
                        {userProfile?.email && (
                            <p className="text-sm text-gray-400 break-words">
                                {userProfile.email}
                            </p>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="flex flex-col gap-2 mt-4 pb-4 border-b border-gray-700">
                        <button
                            onClick={handleEditProfile}
                            className="w-full sm:w-2/3 mx-auto py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 text-sm"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={handleRoomLeave}
                            className="w-full sm:w-2/3 mx-auto py-2 px-4 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium transition duration-200 text-sm"
                        >
                            Leave Room
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full sm:w-2/3 mx-auto py-2 px-4 rounded bg-purple-900 hover:bg-orange-700 text-white font-medium transition duration-200 text-sm"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Room Name in Sidebar */}
                    <h4 className="text-md font-medium mb-2 mt-6 text-gray-200 text-center break-words">
                        Room: <span className="text-rose-400">{roomId}</span>
                    </h4>

                    {/* Connected Users List */}
                    <h4 className="text-md font-medium mb-2 mt-2 text-gray-200">Connected Users</h4>
                    <UserSideBar
                        users={uniqueUserEmailsForSidebar}
                        connectedUserEmails={connectedUsers.map(u => u.email)}
                        currentUser={userProfile}
                        onProfilesUpdate={handleProfilesUpdate}
                    />
                </div>

                {/* Close Sidebar Button */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                    aria-label="Close Sidebar"
                >
                    &times;
                </button>
            </div>

            {/* Header - Responsive adjustments */}
            <header className={`
                fixed top-0 bg-gray-900 py-4 shadow flex items-center justify-between z-10 px-4 sm:px-6 lg:px-10 h-[4.5rem]
                transition-all duration-300 ease-in-out
                left-0 w-full
                ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)]' : ''}
            `}>
                {/* HASHCHAT button (opens sidebar) - only show when sidebar is closed */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-white font-extrabold text-lg sm:text-xl bg-rose-600 hover:bg-rose-700 rounded-md shadow-lg mr-4 flex-shrink-0 flex items-center gap-2" // Added flex and gap
                        aria-label="Open Sidebar"
                    >
                        <MdMenu className="text-2xl" /> {/* Hamburger icon */}
                        <span className="hidden sm:inline">HASHCHAT</span>
                        <span className="sm:hidden">HC</span>
                    </button>
                )}

                {/* Room Name in Middle - Responsive text */}
                <h1 className="text-lg sm:text-xl font-semibold absolute left-1/2 -translate-x-1/2 max-w-[50%] truncate">
                    <span className="hidden sm:inline">#   </span>
                    <span className="text-rose-400">{roomId}</span>
                </h1>

                {/* Leave Room Button on Right - Responsive text */}
                <button
                    onClick={handleRoomLeave}
                    className="dark:bg-rose-600 dark:hover:bg-rose-700 px-3 sm:px-4 py-2 rounded-full font-medium transition duration-200 ml-auto text-sm sm:text-base"
                >
                    <span className="hidden sm:inline">Leave Room</span>
                    <span className="sm:hidden">Leave</span>
                </button>
            </header>

            {/* Main Chat Area - Responsive adjustments */}
            <main
                ref={ChatBoxRef}
                className={`
                    fixed top-[4.5rem] px-4 sm:px-6 lg:px-10 dark:bg-slate-700 overflow-y-auto custom-scrollbar
                    transition-all duration-300 ease-in-out
                    left-0 w-full
                    ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)]' : ''}
                `}
                style={{ bottom: messageInputHeight }}
            >
                <div className="max-w-screen-lg mx-auto h-full pt-4 pb-20"> {/* Added padding to the chat area */}
                    {messages.length === 0 && !isConnecting && (
                        <p className="text-center text-gray-400 mt-10">No messages yet. Start chatting!</p>
                    )}
                    {isConnecting && (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                            <p className="ml-4 text-gray-400">Connecting to chat...</p>
                        </div>
                    )}
                    {messages.map((message, index) => {
                        const isSender = message.senderId === userProfile?.email;
                        const avatarSrc = getMessageAvatar(message);
                        const senderNameColorClass = isSender ? '' : senderColors(message.senderId);

                        // Determine if sender name should be displayed
                        const displaySenderName = !isSender && (
                            index === 0 || // Always show for the first message
                            messages[index - 1].senderId !== message.senderId // Show if previous message was from a different sender
                        );

                        // Add extra padding to the last message
                        const isLastMessage = index === messages.length - 1;
                        const lastMessagePaddingClass = isLastMessage ? "pb-4" : "";


                        return (
                            <div
                                key={index}
                                className={`flex items-end my-2 ${isSender ? "justify-end" : "justify-start"} ${lastMessagePaddingClass}`}
                            >
                                {/* Other sender's avatar on the left */}
                                {!isSender && (
                                    <img
                                        className="h-9 w-9 rounded-full object-cover flex-shrink-0 mr-2 cursor-pointer shadow"
                                        src={avatarSrc}
                                        alt={message.sender.charAt(0)}
                                        onClick={() => openImagePreview(avatarSrc)}
                                    />
                                )}
                                <div
                                    className={`flex flex-col px-4 py-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[66%] w-fit break-words rounded-2xl shadow-md transition-transform duration-200 ${
                                        isSender
                                            ? "bg-green-700 rounded-br-sm order-1" // Current user: message on right, order 1
                                            : "bg-gray-800 rounded-bl-sm order-2" // Other sender: message on left
                                    } hover:scale-[1.01]`}
                                >
                                    {/* Sender Name (only for others, and if different from previous sender) */}
                                    {displaySenderName && message.sender && (
                                        <p className={`text-xs sm:text-sm font-bold mb-1 ${senderNameColorClass} text-left`}>
                                            {message.sender}
                                        </p>
                                    )}
                                    {message.content && (
                                        <p
                                            className="text-sm sm:text-base text-white break-words leading-relaxed"
                                            style={{ overflowWrap: "anywhere" }}
                                        >
                                            {renderMessageContent(message.content)}
                                        </p>
                                    )}
                                    {message.imageUrl && (
                                        <img
                                            src={message.imageUrl}
                                            alt="Sent"
                                            className="mt-2 rounded-md max-w-full h-auto cursor-pointer"
                                            onClick={() => openImagePreview(message.imageUrl)}
                                        />
                                    )}
                                    <p className={`text-[11px] text-gray-400 mt-2 ${isSender ? "text-right" : "text-left"}`}>
                                        {timeAgo(message.timeStamp)}
                                    </p>
                                </div>
                                {/* Current user's avatar on the right */}
                                {isSender && (
                                    <img
                                        className="h-9 w-9 rounded-full object-cover flex-shrink-0 ml-2 cursor-pointer shadow order-2"
                                        src={avatarSrc}
                                        alt="You"
                                        onClick={() => openImagePreview(avatarSrc)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Input message container - Responsive adjustments */}
            <div
                ref={messageInputContainerRef}
                className={`
                    fixed bottom-0 bg-gray-900 py-4 shadow-lg z-10
                    transition-all duration-300 ease-in-out
                    left-0 w-full
                    ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)]' : ''}
                    flex flex-col border-amber-50
                `}
            >
                {/* Image Preview (separate row above the input line) */}
                {selectedImage && (
                    <div className="px-4 pb-2 max-w-screen-lg mx-auto w-full">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <img
                                src={URL.createObjectURL(selectedImage)}
                                alt="Selected"
                                className="w-full h-full object-cover rounded-md border border-gray-600"
                            />
                            <button
                                onClick={() => { setSelectedImage(null); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
                                title="Remove image"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 sm:gap-4 px-4 w-full max-w-screen-lg mx-auto">
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Attachment button */}
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="dark:bg-purple-600 h-8 w-8 sm:h-10 sm:w-10 flex justify-center items-center rounded-full text-white hover:bg-purple-700 transition duration-200 flex-shrink-0"
                        title="Attach File"
                    >
                        <MdAttachFile size={16} className="sm:hidden" />
                        <MdAttachFile size={20} className="hidden sm:block" />
                    </button>

                    {/* Input field */}
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        type="text"
                        placeholder={selectedImage ? "Add a caption or send directly..." : "Type your message here..."}
                        className="flex-1 dark:border-white-600 dark:bg-gray-800 px-3 sm:px-5 py-2 sm:py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 transition duration-150 ease-in-out text-sm sm:text-base"
                        ref={inputRef}
                    />

                    {/* Send button */}
                    <button
                        onClick={sendMessage}
                        className="dark:bg-green-600 h-8 w-8 sm:h-10 sm:w-10 flex justify-center items-center rounded-full text-white hover:bg-green-700 transition duration-200 flex-shrink-0"
                        title="Send Message"
                        disabled={isConnecting && !selectedImage}
                    >
                        <MdSend size={16} className="sm:hidden" />
                        <MdSend size={20} className="hidden sm:block" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;