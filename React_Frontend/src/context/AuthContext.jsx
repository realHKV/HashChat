import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { getProfileApi } from '../services/RoomService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [token, setToken] = useState(() => sessionStorage.getItem('jwtToken') || null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    // Flag to prevent ProtectedRoute from redirecting during logout transition
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const setAuthData = useCallback((newToken, newUserProfile) => {
        setToken(newToken);
        setUserProfile(newUserProfile);
        if (newToken) {
            sessionStorage.setItem('jwtToken', newToken);
            if (newUserProfile) {
                sessionStorage.setItem('userProfile', JSON.stringify(newUserProfile));
            }
        } else {
            sessionStorage.removeItem('jwtToken');
            sessionStorage.removeItem('userProfile');
        }
    }, []);

    const refreshUserProfile = useCallback(async () => {
        const storedToken = sessionStorage.getItem('jwtToken');
        if (storedToken) {
            try {
                const profileResponse = await getProfileApi();
                setAuthData(storedToken, profileResponse);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                // Don't clear auth immediately on error to prevent flickering, 
                // but token might be invalid.
                setAuthData(null, null); 
            }
        } else {
            setAuthData(null, null);
        }
        setLoadingAuth(false);
    }, [setAuthData]);

    const login = useCallback(async (jwtToken) => {
        setLoadingAuth(true);
        setAuthData(jwtToken, null);
        await refreshUserProfile();
    }, [setAuthData, refreshUserProfile]);

    // --- UPDATED LOGOUT LOGIC ---
    const logout = useCallback(() => {
        setIsLoggingOut(true); // 1. Pause ProtectedRoute redirects
        
        // 2. Navigate immediately to the public route
        navigate('/'); 
        
        // 3. Delay clearing data slightly to allow the Router to unmount protected components
        // This prevents race conditions where the protected component tries to fetch data 
        // without a token (CORS/403 errors) or redirects to /login.
        setTimeout(() => {
            setAuthData(null, null);
            setIsLoggingOut(false); 
            toast.success("Logged out successfully!", { icon: '👋' });
        }, 300); // 300ms delay is usually sufficient
    }, [setAuthData, navigate]);

    useEffect(() => {
        // Initial load check
        if (token && !userProfile) {
            refreshUserProfile();
        } else {
            setLoadingAuth(false);
        }
    }, [token, userProfile, refreshUserProfile]);

    const isAuthenticated = useMemo(() => !!token && !!userProfile, [token, userProfile]);

    const authContextValue = useMemo(() => ({
        token,
        userProfile,
        loadingAuth,
        isLoggingOut, 
        login,
        logout,
        isAuthenticated,
        setUserProfile,
        refreshUserProfile
    }), [token, userProfile, loadingAuth, isLoggingOut, login, logout, isAuthenticated, setUserProfile]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- UPDATED PROTECTED ROUTE ---
export const ProtectedRoute = ({ children }) => {
    const { token, loadingAuth, isLoggingOut } = useAuth();

    // If loading OR currently logging out, render a loading state.
    // This effectively unmounts the protected component immediately, stopping its API calls.
    if (loadingAuth || isLoggingOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }
    
    // Only redirect to login if we are fully loaded, not logging out, and have no token
    return token ? children : <Navigate to="/login" replace />;
};

export const PublicRoute = ({ children }) => {
    const { token, loadingAuth } = useAuth();

    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }
    return token ? <Navigate to="/" replace /> : children;
};