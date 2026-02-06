import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdSend, MdMenu, MdLogin, MdClose, MdInfoOutline, MdLock, MdPublic } from 'react-icons/md';
import { BASE_URL } from '../config/AxiosHelper';
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { timeAgo } from '../config/helper';
import { useAuth } from '../context/AuthContext';
import { createGuestUser } from '../config/Guestnamegenerator';

const GlobalChat = () => {
    const { userProfile, token } = useAuth();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    
    // Sidebar Default: Closed on mobile (<768px), Open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [showMobileGuestBanner, setShowMobileGuestBanner] = useState(true);

    const [messageInputHeight, setMessageInputHeight] = useState('5rem');
    const messageInputContainerRef = useRef(null);
    const inputRef = useRef(null);
    const ChatBoxRef = useRef(null);
    const stompClientRef = useRef(null);

    // --- Helper: Get Safe Avatar URL ---
    const getAvatarUrl = (name) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&bold=true`;
    };

    // --- Swipe Gesture Logic ---
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
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
        if (isLeftSwipe) setIsSidebarOpen(false);
    };

    // Initialize user
    useEffect(() => {
        let user;
        if (userProfile && token) {
            user = {
                id: userProfile.email,
                name: userProfile.name,
                email: userProfile.email,
                isGuest: false,
                profilePicUrl: userProfile.profilePicUrl || getAvatarUrl(userProfile.name)
            };
        } else {
            user = createGuestUser();
            const savedGuest = localStorage.getItem('globalChatGuest');
            if (savedGuest) {
                user = JSON.parse(savedGuest);
                // Fix broken legacy avatars
                if (user.profilePicUrl && user.profilePicUrl.includes('avatar.iran.liara.run')) {
                    user.profilePicUrl = getAvatarUrl(user.name);
                    localStorage.setItem('globalChatGuest', JSON.stringify(user));
                }
            } else {
                user.profilePicUrl = getAvatarUrl(user.name);
                localStorage.setItem('globalChatGuest', JSON.stringify(user));
            }
        }
        setCurrentUser(user);
    }, [userProfile, token]);

    // Measure input height
    useEffect(() => {
        if (messageInputContainerRef.current) {
            const timeoutId = setTimeout(() => {
                const height = messageInputContainerRef.current.offsetHeight;
                setMessageInputHeight(`${height}px`);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [input, isSidebarOpen, showMobileGuestBanner]); 

    const senderColors = useMemo(() => {
        const colors = {};
        const availableColors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400', 'text-teal-400'];
        let colorIndex = 0;
        return (senderId) => {
            if (!colors[senderId]) {
                colors[senderId] = availableColors[colorIndex % availableColors.length];
                colorIndex++;
            }
            return colors[senderId];
        };
    }, []);

    useEffect(() => {
        if (ChatBoxRef.current) {
            ChatBoxRef.current.scroll({ top: ChatBoxRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    // WebSocket connection
    useEffect(() => {
        if (!currentUser) return;
        const connectWebSocket = () => {
            setIsConnecting(true);
            const client = Stomp.over(() => new SockJS(`${BASE_URL}/chat`));
            client.debug = () => {};
            client.reconnectDelay = 5000;

            client.connect(
                currentUser.isGuest 
                    ? { "X-Guest-Mode": "true" } 
                    : { "Authorization": `Bearer ${token}`, "X-Guest-Mode": "false" },
                () => {
                    console.log("✅ Connected to Global Stage");
                    setConnected(true);
                    setIsConnecting(false);
                    stompClientRef.current = client;

                    client.subscribe("/topic/global", (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        setMessages((prev) => {
                            const isDuplicate = prev.some(msg => 
                                msg.senderId === receivedMessage.senderId && 
                                msg.content === receivedMessage.content &&
                                Math.abs(new Date(msg.timeStamp) - new Date(receivedMessage.timeStamp)) < 1000
                            );
                            if (isDuplicate) return prev;
                            return [...prev, receivedMessage];
                        });
                    });
                    toast.success(currentUser.isGuest ? `Welcome to the Stage, ${currentUser.name}!` : "Welcome back to the Stage!");
                },
                (error) => {
                    console.error("❌ WebSocket connection error:", error);
                    setIsConnecting(false);
                }
            );
        };
        connectWebSocket();
        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect(() => console.log("Disconnected from Global Stage"));
            }
        };
    }, [currentUser, token]);

    const sendMessage = useCallback(() => {
        if (!input.trim() || !connected || !stompClientRef.current) return;
        const messageRequest = {
            sender: currentUser.name,
            senderId: currentUser.id,
            content: input.trim(),
            imageUrl: currentUser.profilePicUrl 
        };
        stompClientRef.current.send("/app/global/sendMessage", {}, JSON.stringify(messageRequest));
        setInput("");
        inputRef.current?.focus();
    }, [input, connected, currentUser]);

    const handleLogin = () => navigate('/login');
    const handleGoToRooms = () => navigate('/rooms');

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mb-4"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white overflow-hidden">
            
            {/* Sidebar Container */}
            <div 
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                className={`
                    fixed top-0 left-0 h-full bg-gray-800 shadow-2xl z-50
                    transform transition-transform duration-300 ease-in-out
                    w-64 sm:w-72 lg:w-80
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    flex flex-col
                `}
            >
                {/* 1. SIDEBAR CLOSE BUTTON */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold z-50 bg-gray-800/50 rounded-full p-1"
                    aria-label="Close Sidebar"
                >
                    <MdClose />
                </button>

                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pt-16">
                    {/* HASHCHAT Title */}
                    <div className="absolute top-0 left-0 right-0 py-4 px-4 text-center bg-gray-900 border-b border-gray-700 z-40">
                        <h2 className="text-2xl font-extrabold text-rose-500">HASHCHAT</h2>
                    </div>

                    <div className="p-6 border-b border-gray-700">
                        <div className="text-center">
                            <img
                                src={currentUser.profilePicUrl}
                                onError={(e) => { e.target.src = getAvatarUrl(currentUser.name); }}
                                alt={currentUser.name}
                                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-rose-500 mb-3"
                            />
                            <h3 className="text-xl font-semibold mb-1 truncate">{currentUser.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{currentUser.isGuest ? "Guest Viewer" : currentUser.email}</p>

                            <div className="flex flex-col gap-2">
                                {currentUser.isGuest ? (
                                    <button onClick={handleLogin} className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition flex items-center justify-center gap-2">
                                        <MdLogin size={20} /> Login to Join Rooms
                                    </button>
                                ) : (
                                    <button onClick={handleGoToRooms} className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition">
                                        Go to Private Rooms
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {currentUser.isGuest && (
                        <div className="p-6 mt-4">
                            <h4 className="text-rose-400 font-bold mb-3 uppercase tracking-wide text-sm">Member Benefits</h4>
                            <ul className="text-sm text-gray-400 space-y-3">
                                <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Save Unique Username</li>
                                <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Custom Profile Picture</li>
                                <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Create Private Rooms</li>
                                <li className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> <span>Encrypted Private Messages</span> <MdLock className="text-green-400 text-xs" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 ml-6 italic">(Global Stage is Public <MdPublic className="inline text-[9px]"/>)</span>
                                </li>
                            </ul>
                        </div>
                    )}
                    <div className="p-6 text-center text-gray-500 mt-auto"><p>HASHCHAT v1.0</p></div>
                </div>
            </div>

            {/* Header */}
            <header className={`
                fixed top-0 bg-gray-800 shadow-md py-4 px-4 sm:px-6 flex items-center justify-between z-30 h-[4.5rem]
                transition-all duration-300 ease-in-out
                left-0 w-full
                ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)] lg:left-80 lg:w-[calc(100%-20rem)]' : ''}
            `}>
                <div className="flex items-center gap-4">
                    {/* 2. SIDEBAR TOGGLE BUTTON: Now inside Header to prevent collision */}
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-white font-extrabold text-lg sm:text-xl bg-rose-600 hover:bg-rose-700 rounded-md shadow-lg flex-shrink-0 flex items-center gap-2 transition"
                            aria-label="Open Sidebar"
                        >
                            <MdMenu className="text-2xl" />
                            <span className="hidden sm:inline">HASHCHAT</span>
                            <span className="sm:hidden">HC</span>
                        </button>
                    )}
                    
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-rose-500">Global Stage</h1>
                        <p className="text-[10px] sm:text-sm text-gray-400">{connected ? "Live" : "Connecting..."}</p>
                    </div>
                </div>

                {currentUser.isGuest ? (
                    <button onClick={handleLogin} className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition text-sm sm:text-base font-medium">
                        <MdLogin size={20} /> <span>Login</span>
                    </button>
                ) : (
                    <button onClick={handleGoToRooms} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                        <span className="hidden sm:inline">Private Rooms</span><span className="sm:hidden">Rooms</span>
                    </button>
                )}
            </header>

            {/* Main Chat & Input */}
            <main ref={ChatBoxRef} className={`fixed top-[4.5rem] px-4 sm:px-6 lg:px-10 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out left-0 w-full ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)] lg:left-80 lg:w-[calc(100%-20rem)]' : ''} ${currentUser.isGuest && showMobileGuestBanner ? 'pt-14 sm:pt-4' : 'pt-4'}`} style={{ bottom: messageInputHeight }}>
                <div className="max-w-screen-lg mx-auto h-full pt-4 pb-4">
                    {messages.map((message, index) => {
                        const isSender = message.senderId === currentUser.id;
                        const avatarUrl = isSender ? currentUser.profilePicUrl : (message.imageUrl || getAvatarUrl(message.sender));
                        return (
                            <div key={`${message.senderId}-${message.timeStamp}-${index}`} className={`flex items-end my-2 ${isSender ? "justify-end" : "justify-start"}`}>
                                {!isSender && <img className="h-9 w-9 rounded-full object-cover flex-shrink-0 mr-2 shadow" src={avatarUrl} onError={(e) => { e.target.src = getAvatarUrl(message.sender); }} alt={message.sender?.charAt(0) || 'U'} />}
                                <div className={`flex flex-col px-4 py-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[66%] w-fit break-words rounded-2xl shadow-md ${isSender ? "bg-green-700 rounded-br-sm" : "bg-gray-800 rounded-bl-sm"}`}>
                                    {!isSender && (index === 0 || messages[index - 1].senderId !== message.senderId) && <p className={`text-xs font-bold mb-1 ${senderColors(message.senderId)}`}>{message.sender}</p>}
                                    <p className="text-sm text-white break-words leading-relaxed">{message.content}</p>
                                    <p className={`text-[11px] text-gray-400 mt-2 ${isSender ? "text-right" : "text-left"}`}>{timeAgo(message.timeStamp)}</p>
                                </div>
                                {isSender && <img className="h-9 w-9 rounded-full object-cover flex-shrink-0 ml-2 shadow" src={avatarUrl} onError={(e) => { e.target.src = getAvatarUrl(currentUser.name); }} alt="You" />}
                            </div>
                        );
                    })}
                </div>
            </main>

            <div ref={messageInputContainerRef} className={`fixed bottom-0 bg-gray-900 py-4 shadow-lg z-40 border-t border-gray-800 transition-all duration-300 ease-in-out left-0 w-full ${isSidebarOpen ? 'sm:left-72 sm:w-[calc(100%-18rem)] lg:left-80 lg:w-[calc(100%-20rem)]' : ''}`}>
                <div className="flex items-center gap-3 sm:gap-4 px-4 max-w-screen-lg mx-auto">
                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} type="text" placeholder="Type to send message ..." className="flex-1 px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition text-sm sm:text-base" disabled={!connected} />
                    <button onClick={sendMessage} className="h-9 w-9 sm:h-10 sm:w-10 flex justify-center items-center rounded-full bg-green-600 hover:bg-green-700 text-white transition flex-shrink-0" disabled={!connected || !input.trim()}>
                        <MdSend size={18} className="sm:hidden" />
                        <MdSend size={20} className="hidden sm:block" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalChat;