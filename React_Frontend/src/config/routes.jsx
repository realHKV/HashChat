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


const AppRoutes = () => {
  return (
    <Routes>
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
      <Route // Added the About page route here
        path="/about"
        element={
          <PublicRoute>
            <AboutPage />
          </PublicRoute>
        }
      />

      {/* Protected routes - only accessible when logged in */}
      <Route // Added the About page route here
        path="/aboutPage"
        element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <JoinRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat" // Corrected this to include roomId parameter
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

      {/* Catch all route - redirect to login if not authenticated, to home if authenticated */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;