import React, { createContext, useContext, useState, useEffect } from 'react'; 
import { useAuth } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    // Get userProfile and loadingAuth from AuthContext
    const { userProfile, loadingAuth } = useAuth();

    const [roomId, setRoomId] = useState(() => localStorage.getItem('chatRoomId') || "");
    const [currentUser, setCurrentUser] = useState(() => {
        // console.log("Raw user data:", localStorage.getItem("user"));
        const storedUser = localStorage.getItem('chatCurrentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [connected, setConnected] = useState(() => {
        const storedConnected = localStorage.getItem('chatConnected');
        return storedConnected ? JSON.parse(storedConnected) : false;
    });

    // useEffect to initialize/update currentUser from AuthContext's userProfile 
    useEffect(() => {
        if (!loadingAuth && userProfile && userProfile.name) {
            // Set the currentUser in ChatContext from the authenticated user's profile
            try{
                setCurrentUser(userProfile);
                // console.log("ChatContext: currentUser set to",userProfile);
                // console.log(currentUser) // For debugging
            }catch(error){
                console.error("Error setting currentUser:", error);
            }
        } else if (!loadingAuth && !userProfile) {
            // Clear currentUser if user logs out or profile isn't available
            setCurrentUser({});
            // console.log("ChatContext: currentUser cleared (no user profile)."); // For debugging
        }
    }, [userProfile, loadingAuth]); // Depend on userProfile and loadingAuth


    // In ChatProvider
// useEffect(() => {
//     if (currentUser) {
//         console.log("ChatContext: currentUser updated:", currentUser);
//     }
// }, [currentUser]); 



    // Effect to persist roomId to localStorage
    useEffect(() => {
        if (roomId) {
            localStorage.setItem('chatRoomId', roomId);
        } else {
            localStorage.removeItem('chatRoomId');
        }
    }, [roomId]);

    // Effect to persist currentUser to localStorage
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('chatCurrentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('chatCurrentUser');
        }
    }, [currentUser]);

    // Effect to persist connected status to localStorage
    useEffect(() => {
        localStorage.setItem('chatConnected', JSON.stringify(connected));
    }, [connected]);



    return (
        <ChatContext.Provider
            value={{ roomId, currentUser, setRoomId, setCurrentUser, connected, setConnected }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => useContext(ChatContext);