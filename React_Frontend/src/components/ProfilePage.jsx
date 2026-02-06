import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { updateProfileApi, deleteAccountApi } from '../services/RoomService';
import { useAuth } from '../context/AuthContext';

const ProfileUpdate = () => {
    const { userProfile, loadingAuth, refreshUserProfile, logout } = useAuth();
    const navigate = useNavigate();

    // State for form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    // UPDATED DEFAULT
    const [profilePicPreview, setProfilePicPreview] = useState("https://ui-avatars.com/api/?name=User&background=random");
    const [isLoading, setIsLoading] = useState(false);

    // State for Delete Account Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteLogs, setDeleteLogs] = useState([]);
    const [deleteComplete, setDeleteComplete] = useState(false);

    const fileInputRef = useRef(null);
    const LOCAL_STORAGE_PROFILE_KEY = 'cachedUserProfiles';

    useEffect(() => {
        if (!loadingAuth && userProfile) {
            setName(userProfile.name || '');
            setDescription(userProfile.description || '');
            setProfilePicPreview(userProfile.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=random`);
        } else if (!loadingAuth && !userProfile) {
            toast.error("You must be logged in to view this page.");
            navigate('/login');
        }
    }, [userProfile, loadingAuth, navigate]);

    const invalidateUserCache = (userEmail) => {
        try {
            const cachedProfiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)) || {};
            if (cachedProfiles[userEmail]) {
                delete cachedProfiles[userEmail];
                localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(cachedProfiles));
            }
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { 
                toast.error("Image file size must be less than 5MB.");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        } else {
            setProfilePicFile(null);
            setProfilePicPreview(userProfile?.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=random`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Updating profile...");

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            if (profilePicFile) {
                formData.append('profilePic', profilePicFile);
            }

            await updateProfileApi(formData);
            await refreshUserProfile();
            invalidateUserCache(userProfile.email);

            toast.success('Profile updated successfully!', { id: toastId });
            navigate(-1);
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update profile.';
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const addDeleteLog = (message) => {
        setDeleteLogs(prev => [...prev, message]);
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error("Please enter your password to confirm.");
            return;
        }

        setIsDeleting(true);
        setDeleteLogs([]); // Reset logs
        const startTime = Date.now();

        addDeleteLog("Initiating deletion process...");
        
        await new Promise(resolve => setTimeout(resolve, 300));
        addDeleteLog("Authenticating user credentials...");

        try {
            const apiCall = deleteAccountApi(deletePassword);
            
            await new Promise(resolve => setTimeout(resolve, 600));
            addDeleteLog("Deleting profile pictures from storage...");
            
            await new Promise(resolve => setTimeout(resolve, 600));
            addDeleteLog("Anonymizing chat history in MongoDB...");
            
            await new Promise(resolve => setTimeout(resolve, 600));
            addDeleteLog("Removing account data and memberships...");

            await apiCall;

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            addDeleteLog(`✅ Success! Account deleted in ${duration} seconds.`);
            setDeleteComplete(true);

            setTimeout(() => {
                logout(); 
                navigate('/'); 
            }, 3000);

        } catch (error) {
            console.error("Delete account error:", error);
            setIsDeleting(false);
            const errorMessage = error.response?.data?.error || "Failed to delete account.";
            addDeleteLog(`❌ Error: ${errorMessage}`);
            toast.error(errorMessage);
        }
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading profile data...</p>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-red-500">Error: User profile not found. Please log in.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Edit Profile</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <img
                            src={profilePicPreview}
                            alt="Profile Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-rose-500 mb-4"
                            // UPDATED
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=random`; }}
                        />
                        <label htmlFor="profilePic" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out">
                            Change Profile Picture
                            <input
                                type="file"
                                id="profilePic"
                                name="profilePic"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                        </label>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            rows="4"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Updating...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <hr className="my-8 border-gray-300 dark:border-gray-700" />

                <div className="text-center">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-2 px-4 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>

                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            Delete Account
                                        </h3>
                                        <div className="mt-2">
                                            {!isDeleting && !deleteComplete ? (
                                                <>
                                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                                        Are you sure you want to delete your account? This action cannot be undone.
                                                        Your profile pictures will be deleted, and your chat history will be anonymized.
                                                    </p>
                                                    <div className="mt-4">
                                                        <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Enter Password to Confirm
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="delete-password"
                                                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                                            placeholder="Password"
                                                            value={deletePassword}
                                                            onChange={(e) => setDeletePassword(e.target.value)}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="mt-4 bg-gray-900 rounded p-4 text-left font-mono text-sm text-green-400 h-48 overflow-y-auto">
                                                    {deleteLogs.map((log, index) => (
                                                        <div key={index} className="mb-1">
                                                            <span className="text-gray-500 mr-2">{'>'}</span>
                                                            {log}
                                                        </div>
                                                    ))}
                                                    {!deleteComplete && (
                                                        <div className="animate-pulse">_</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {!isDeleting && !deleteComplete && (
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Delete Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeletePassword('');
                                        }}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileUpdate;