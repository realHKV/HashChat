import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { deleteAccountApi } from '../services/RoomService';
import { useAuth } from '../context/AuthContext';

const DeleteAccount = () => {
    const { userProfile, loadingAuth, logout } = useAuth();
    const navigate = useNavigate();

    const [deletePassword, setDeletePassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteLogs, setDeleteLogs] = useState([]);
    const [deleteComplete, setDeleteComplete] = useState(false);

    const LOCAL_STORAGE_PROFILE_KEY = 'cachedUserProfiles';

    const addDeleteLog = (message) => {
        setDeleteLogs(prev => [...prev, message]);
    };

    const handleDeleteAccount = async () => {
        // Validation
        if (!deletePassword) {
            toast.error("Please enter your password to confirm.");
            return;
        }

        if (confirmText.trim().toLowerCase() !== 'delete my account') {
            toast.error('Please type "delete my account" to confirm.');
            return;
        }

        setIsDeleting(true);
        setDeleteLogs([]); // Reset logs

        // Simulate initial "starting" steps for UI feedback
        addDeleteLog("🔒 Initiating deletion process...");
        
        await new Promise(resolve => setTimeout(resolve, 300));
        addDeleteLog("🔑 Authenticating user credentials...");

        try {
            // Start the API call
            const apiCall = deleteAccountApi(deletePassword);
            
            // Simulate steps while waiting
            await new Promise(resolve => setTimeout(resolve, 600));
            addDeleteLog("🗑️  Removing account data and memberships...");
            
            await new Promise(resolve => setTimeout(resolve, 600));
            addDeleteLog("🧹 Clearing user sessions...");

            // Now await the actual result
            await apiCall;

            await new Promise(resolve => setTimeout(resolve, 500));
            addDeleteLog("✅ Account deleted successfully!");
            
            setDeleteComplete(true);

            // Give user time to read success message
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Clear all user data and logout
            sessionStorage.removeItem('jwtToken');
            localStorage.removeItem('userProfile');
            localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
            localStorage.removeItem('globalChatGuest');
            
            toast.success('Account deleted successfully. Goodbye! 👋');
            
            // Logout and redirect
            logout();
            navigate('/');

        } catch (error) {
            console.error('Error deleting account:', error);
            const errorMessage = error.response?.data?.error || 'Failed to delete account. Please try again.';
            
            addDeleteLog(`❌ ERROR: ${errorMessage}`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsDeleting(false);
            setDeleteComplete(false);
            toast.error(errorMessage);
        }
    };

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

    if (!userProfile) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl md:max-w-2xl sm:mx-auto w-full px-4 sm:px-0">
                <div className="relative px-4 py-10 bg-white dark:bg-gray-800 shadow-lg sm:rounded-3xl sm:p-10">
                    
                    {/* Header */}
                    <div className="max-w-md mx-auto mb-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-center text-red-600 mb-2">Delete Account</h2>
                        <p className="text-center text-gray-600 dark:text-gray-400">
                            This action is permanent and cannot be undone
                        </p>
                    </div>

                    {/* Deletion Process Display */}
                    {isDeleting || deleteComplete ? (
                        <div className="max-w-md mx-auto">
                            <div className="bg-gray-900 rounded-lg p-6 text-left font-mono text-sm text-green-400 h-96 overflow-y-auto shadow-inner">
                                {deleteLogs.map((log, index) => (
                                    <div key={index} className="mb-2 flex items-start">
                                        <span className="text-gray-500 mr-3">{'>'}</span>
                                        <span className="flex-1">{log}</span>
                                    </div>
                                ))}
                                {!deleteComplete && (
                                    <div className="flex items-center mt-2">
                                        <span className="text-gray-500 mr-3">{'>'}</span>
                                        <div className="animate-pulse">_</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Deletion Form */
                        <div className="max-w-md mx-auto space-y-6">
                            {/* Warning Box */}
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                            Warning: Account Deletion
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Your account will be permanently deleted</li>
                                                <li>All your room memberships will be removed</li>
                                                <li>Your messages will show as "Deleted User"</li>
                                                <li>This action cannot be reversed</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={userProfile.profilePicUrl || "https://avatar.iran.liara.run/public/43"}
                                        alt={userProfile.name}
                                        className="h-16 w-16 rounded-full object-cover border-2 border-red-500"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{userProfile.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{userProfile.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Text Input */}
                            <div>
                                <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type <span className="font-bold text-red-600">"delete my account"</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    id="confirm-text"
                                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white p-3"
                                    placeholder="delete my account"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Enter your password to confirm
                                </label>
                                <input
                                    type="password"
                                    id="delete-password"
                                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white p-3"
                                    placeholder="Password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleDeleteAccount();
                                        }
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={!deletePassword || confirmText.trim().toLowerCase() !== 'delete my account'}
                                    className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delete My Account
                                </button>
                            </div>

                            {/* Additional Info */}
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4">
                                Need help? <a href="/about" className="text-blue-600 hover:underline">Contact support</a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;