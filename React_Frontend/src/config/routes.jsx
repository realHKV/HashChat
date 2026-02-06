import React from 'react';
import { Routes, Route, Navigate } from 'react-router'; 
import Login from '../components/Login';
import Signup from '../components/SignUp';
import EmailVerification from '../components/EmailVerification.jsx';
import JoinRoom from '../components/joinRoom.jsx';
import ChatPage from '../components/ChatPage';
import { ProtectedRoute, PublicRoute, useAuth } from '../context/AuthContext';
import ProfilePage from '../components/ProfilePage.jsx';
import AboutPage from '../components/AboutPage.jsx';
import GlobalChat from '../components/GlobalChat.jsx';
import DeleteAccount from '../components/DeleteAccount.jsx';

// Wrapper component to redirect authenticated users from global chat to rooms
const GlobalChatOrRedirect = () => {
  const { userProfile, token, isLoggingOut } = useAuth();
  
  // FIX: If we are in the process of logging out, do NOT redirect to rooms.
  // Just show the Global Chat (guest view).
  if (isLoggingOut) {
    return <GlobalChat />;
  }

  // If user is authenticated, redirect to rooms
  if (userProfile && token) {
    return <Navigate to="/rooms" replace />;
  }
  
  // Otherwise show global chat (for guests)
  return <GlobalChat />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Global Chat - Landing Page for guests, redirects authenticated users to /rooms */}
      <Route path="/" element={<GlobalChatOrRedirect />} />
      
      {/* Global Chat - Accessible route for authenticated users who explicitly want to join */}
      <Route path="/global" element={<GlobalChat />} />

      {/* Public routes - only accessible when not logged in */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <EmailVerification />
          </PublicRoute>
        }
      />
      <Route // About page accessible to non-logged in users
        path="/about"
        element={
          <PublicRoute>
            <AboutPage />
          </PublicRoute>
        }
      />

      {/* Protected routes - only accessible when logged in */}
      <Route // About page for logged in users
        path="/aboutPage"
        element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        }
      />

      <Route // Private rooms
        path="/rooms"
        element={
          <ProtectedRoute>
            <JoinRoom />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"  
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Delete Account Page - Protected Route */}
      <Route
        path="/delete-account"
        element={
          <ProtectedRoute>
            <DeleteAccount />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to home */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;