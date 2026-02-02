import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { updateProfileApi } from '../services/RoomService';
import { useAuth } from '../context/AuthContext';
// import { defaultUserPic } from '../assets/defaultUserPic';

const ProfileUpdate = () => {
    // ✨ 1. Get `refreshUserProfile` from useAuth, not setUserProfile
    const { userProfile, loadingAuth, refreshUserProfile } = useAuth();
    const navigate = useNavigate();

    // State for form fields
    const [name, setName] = useState('');
    // const [username, setUsername] = useState(''); // ✨ 2. Add state for username
    const [description, setDescription] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState("https://avatar.iran.liara.run/public/43");
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef(null);
    const LOCAL_STORAGE_PROFILE_KEY = 'cachedUserProfiles';

    useEffect(() => {
        if (!loadingAuth && userProfile) {
            setName(userProfile.name || '');
            // setUsername(userProfile.username || ''); // ✨ 3. Populate username state
            setDescription(userProfile.description || '');
            setProfilePicPreview(userProfile.profilePicUrl || "https://avatar.iran.liara.run/public/43");
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
                // console.log(`Cache invalidated for user: ${userEmail}`);
            }
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Image file size must be less than 5MB.");
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        } else {
            setProfilePicFile(null);
            setProfilePicPreview(userProfile?.profilePicUrl || "https://avatar.iran.liara.run/public/43");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Updating profile...");

        try {
            const formData = new FormData();
            formData.append('name', name);
            // formData.append('username', username);
            formData.append('description', description);
            if (profilePicFile) {
                formData.append('profilePic', profilePicFile);
            }

            await updateProfileApi(formData);
            
            // 4. Call the context's refresh function and invalidate the local cache
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

    // Only render the form if userProfile is available
    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-red-500">Error: User profile not found. Please log in.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Edit Profile</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center">
                        <img
                            src={profilePicPreview}
                            alt="Profile Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-rose-500 mb-4"
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

                    

                    {/* Name Input */}
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

                    {/* Description Input */}
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

                    {/* Submit & Cancel Buttons */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdate;