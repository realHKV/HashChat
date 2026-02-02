import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router';
// import { toast } from 'react-toastify';
import { getProfileApi } from '../services/RoomService';
import toast from 'react-hot-toast';
import HttpClient, { BASE_URL } from '../config/AxiosHelper';


export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [token, setToken] = useState(() => sessionStorage.getItem('jwtToken') || null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // Keep loading true initially

    // This function sets the auth data (token and profile)
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

    // Function to refresh the user's profile based on the stored token
    const refreshUserProfile = useCallback(async () => {
        const storedToken = sessionStorage.getItem('jwtToken');
        // console.log("refreshUserProfile called. Stored token:", !!storedToken);

        if (storedToken) {
            // HttpClient.setAuthToken(storedToken); // <-- REMOVE THIS LINE: Not needed, interceptor handles it
            try {
                const profileResponse = await getProfileApi();
                // console.log("Profile API response:", profileResponse); // Log profile response
                setAuthData(storedToken, profileResponse); // Update context with fresh profile
                // console.log("Profile data:", profileResponse.data);
                setLoadingAuth(false); // Authentication successful, stop loading
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                toast.error("Failed to load user profile. Please log in again.");
                setAuthData(null, null); // Clear token and profile on error
                setLoadingAuth(false); // Stop loading even on error
                // navigate('/login'); // Optionally navigate to login on profile fetch failure
            }
        } else {
            // console.log("refreshUserProfile: No token, setting loadingAuth to false.");
            setAuthData(null, null); // Ensure no stale token/profile
            setLoadingAuth(false); // No token, authentication complete (unauthenticated)
        }
    }, [setAuthData, navigate]);

    // New login function to be exposed via context
    const login = useCallback(async (jwtToken) => {
        setLoadingAuth(true); // Start loading when login process begins
        setAuthData(jwtToken, null); // Store the token immediately, profile is null for now

        // Immediately refresh profile after setting the token in sessionStorage
        // The interceptor will pick up the token from sessionStorage for getProfileApi()
        await refreshUserProfile();
    }, [setAuthData, refreshUserProfile]);


    // Logout function
    const logout = useCallback(() => {
        setAuthData(null, null);
        // HttpClient.setAuthToken(null); // <-- REMOVE THIS LINE: Not needed, interceptor handles it
        toast.success("Logged out successfully!", { icon: '👋' });
        navigate('/login');
    }, [setAuthData, navigate]);

    // Effect to run on initial load to check existing token
    useEffect(() => {
        // console.log("AuthContext useEffect running. Current token state:", !!token);
        // Only refresh if we haven't already loaded or explicitly have a token in state
        if (token && !userProfile) { // If token exists but profile is not loaded (e.g., first load)
            refreshUserProfile();
        } else if (!token) { // If no token from sessionStorage, we're not authenticated
             setLoadingAuth(false);
        } else { // Token and userProfile already loaded from sessionStorage
            setLoadingAuth(false);
        }
    }, [token, userProfile, refreshUserProfile]); // Dependencies ensure this runs when token or profile change


    // Axios interceptor is already set up in AxiosHelper.js and imported as HttpClient
    // No need to set it up again here. The import of HttpClient already makes it available.
    // The interceptor automatically reads from sessionStorage.

    const isAuthenticated = useMemo(() => !!token && !!userProfile, [token, userProfile]);

    const authContextValue = useMemo(() => ({
        token,
        userProfile,
        loadingAuth,
        login, // Expose the new login function
        logout,
        isAuthenticated,
        setUserProfile, // Expose setUserProfile for profile updates
        refreshUserProfile
    }), [token, userProfile, loadingAuth, login, logout, isAuthenticated, setUserProfile]);

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

// ProtectedRoute.jsx (or AuthContext.js if defined there)
export const ProtectedRoute = ({ children }) => {
    const { token, loadingAuth } = useAuth();
    // console.log("ProtectedRoute rendering: token=", !!token, "loadingAuth=", loadingAuth);

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
    return token ? children : <Navigate to="/login" replace />;
};

// PublicRoute.jsx (or AuthContext.js if defined there)
export const PublicRoute = ({ children }) => {
    const { token, loadingAuth } = useAuth();
    // console.log("PublicRoute rendering: token=", !!token, "loadingAuth=", loadingAuth);

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
    return token ? <Navigate to="/" replace /> : children; // Navigate to home if authenticated
};