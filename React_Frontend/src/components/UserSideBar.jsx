import { useCallback, useEffect, useState } from "react";
import { getProfileByEmailApi } from "../services/RoomService";
import UserProfileModal from "./UserProfileModal";

const genericAvatarBaseUrl = "https://avatar.iran.liara.run/public/";
const LOCAL_STORAGE_PROFILE_KEY = 'cachedUserProfiles';
const CACHE_VERSION = 'v2'; // Increment if you change profile structure
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const UserSideBar = ({ users, connectedUserEmails, currentUser, onProfilesUpdate }) => {
    // `allDisplayableUserProfiles` will hold the combined and processed list of user profile objects
    const [allDisplayableUserProfiles, setAllDisplayableUserProfiles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // For profile modal

    // Function to check if cached data is valid
    const isCacheValid = useCallback((cachedProfile) => {
        return cachedProfile &&
            cachedProfile.email && // Ensure email exists
            cachedProfile.name &&
            cachedProfile.cacheVersion === CACHE_VERSION &&
            cachedProfile.timestamp &&
            (Date.now() - cachedProfile.timestamp) < CACHE_EXPIRY_MS;
    }, []);

    // Function to force refresh a specific user's profile
    const refreshUserProfile = useCallback(async (userEmail) => {
        // console.log(`Force refreshing profile for: ${userEmail}`);
        
        // Remove from cache first
        const cachedProfiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)) || {};
        if (cachedProfiles[userEmail]) {
            delete cachedProfiles[userEmail];
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(cachedProfiles));
        }

        // If this user is in our current user list, refresh the entire list
        if (users && users.includes(userEmail)) {
            fetchAndCacheUserProfiles(users);
        }
    }, [users]);

    // Listen for profile update events
    useEffect(() => {
        const handleProfileUpdate = (event) => {
            const { email } = event.detail;
            // console.log(`Received profile update event for: ${email}`);
            refreshUserProfile(email);
        };

        // Listen for custom profile update events
        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, [refreshUserProfile]);

    // Also listen for current user changes from AuthContext
    useEffect(() => {
        if (currentUser && currentUser.email) {
            // When currentUser changes (like after profile update), refresh their profile in the list
            refreshUserProfile(currentUser.email);
        }
    }, [currentUser, refreshUserProfile]);

    const fetchAndCacheUserProfiles = useCallback(async (userEmailsToProcess) => {
        const cachedProfiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)) || {};
        const newProfilesMap = {}; // Use a map for easier updates

        const profilesToFetch = [];

        userEmailsToProcess.forEach(email => {
            if (email === currentUser?.email) {
                // Always use current user's most up-to-date profile
                newProfilesMap[email] = {
                    id: currentUser.id,
                    email: currentUser.email,
                    name: currentUser.name,
                    profilePicUrl: currentUser.profilePicUrl,
                    description: currentUser.description || '', // Include description
                };
            } else if (isCacheValid(cachedProfiles[email])) {
                newProfilesMap[email] = cachedProfiles[email];
                // console.log(`Using valid cached profile for ${email}:`, cachedProfiles[email]);
            } else {
                profilesToFetch.push(email);
                if (cachedProfiles[email]) {
                    console.log(`Cache invalid for ${email}, will refetch:`, cachedProfiles[email]);
                }
            }
        });

        if (profilesToFetch.length > 0) {
            // console.log("Fetching profiles for:", profilesToFetch);

            const fetchedResponses = await Promise.allSettled(
                profilesToFetch.map(email => getProfileByEmailApi(email))
            );

            fetchedResponses.forEach((result, index) => {
                const email = profilesToFetch[index];
                // console.log(`API response for ${email}:`, result);
                // console.log("result.value:", result.value);
                if (result.status === 'fulfilled' && result.value) {
                    const profileData = result.value;
                    // console.log(`Profile data for ${email}:`, profileData);

                    // Ensure profileData has a valid name, otherwise fallback
                    if (profileData.name && profileData.name.trim() !== '') {
                        newProfilesMap[email] = {
                            id: profileData.id,
                            email: profileData.email,
                            name: profileData.name,
                            profilePicUrl: profileData.profilePicUrl || null,
                            description: profileData.description || '', // Include description
                            cacheVersion: CACHE_VERSION,
                            timestamp: Date.now()
                        };
                        // console.log(`Successfully cached profile for ${email}:`, newProfilesMap[email]);
                    } else {
                        console.warn(`Invalid profile data for ${email}, using fallback:`, profileData);
                        newProfilesMap[email] = {
                            id: null,
                            email: email,
                            name: email.split('@')[0],
                            profilePicUrl: null,
                            description: '', // Empty description for fallback
                            isTemporary: true
                        };
                    }
                } else {
                    console.error(`Failed to fetch profile for ${email}:`, result.reason || "Unknown error");
                    // Fallback for failed fetches
                    newProfilesMap[email] = {
                        id: null,
                        email: email,
                        name: email.split('@')[0],
                        profilePicUrl: null,
                        description: '', // Empty description for fallback
                        isTemporary: true
                    };
                }
            });

            // Update localStorage with newly fetched valid profiles
            const profilesToCache = {};
            Object.keys(newProfilesMap).forEach(email => {
                if (!newProfilesMap[email].isTemporary && newProfilesMap[email].email === email) { // Only cache non-temporary, valid profiles
                    profilesToCache[email] = newProfilesMap[email];
                }
            });

            if (Object.keys(profilesToCache).length > 0) {
                const updatedCache = { ...cachedProfiles, ...profilesToCache };
                // console.log("Updating localStorage with valid profiles:", profilesToCache);
                localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedCache));
            }
        }

        // Convert map to array and sort
        const finalSortedUserProfiles = Object.values(newProfilesMap).sort((a, b) => {
            const aIsConnected = connectedUserEmails.includes(a.email);
            const bIsConnected = connectedUserEmails.includes(b.email);

            // Prioritize current user at the very top
            if (a.email === currentUser?.email) return -1;
            if (b.email === currentUser?.email) return 1;

            // Then prioritize connected users
            if (aIsConnected && !bIsConnected) return -1;
            if (!aIsConnected && bIsConnected) return 1;

            // Finally, sort by name alphabetically
            return a.name.localeCompare(b.name);
        });

        // console.log("Final processed and sorted User Profiles for Sidebar:", finalSortedUserProfiles);
        // Only update state if the new array is different from the current one
        setAllDisplayableUserProfiles(prev => {
            // Simple stringify check for deep comparison - adjust for very large objects if performance is an issue
            if (JSON.stringify(prev) === JSON.stringify(finalSortedUserProfiles)) {
                return prev;
            }
            return finalSortedUserProfiles;
        });
    }, [currentUser, isCacheValid, connectedUserEmails]);

    useEffect(() => {
        // `users` prop from ChatPage will contain ALL unique emails (connected + past users from DB)
        // If users are provided, initiate fetching/caching
        if (users && users.length > 0) {
            fetchAndCacheUserProfiles(users);
        } else {
            // If no users, clear the displayed list (e.g., when leaving a room)
            setAllDisplayableUserProfiles([]);
        }
    }, [users, currentUser, fetchAndCacheUserProfiles]);

    // Call the callback whenever profiles update to send back to ChatPage
    useEffect(() => {
        if (onProfilesUpdate) {
            // console.log("Calling onProfilesUpdate with:", allDisplayableUserProfiles);
            // Ensure onProfilesUpdate is memoized in ChatPage (it is in the provided code)
            onProfilesUpdate(allDisplayableUserProfiles);
        }
    }, [allDisplayableUserProfiles, onProfilesUpdate]);

    const clearCache = () => {
        localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        // console.log("Profile cache cleared");
        // Re-fetch profiles after clearing cache
        if (users && users.length > 0) {
            fetchAndCacheUserProfiles(users);
        } else {
            setAllDisplayableUserProfiles([]);
        }
    };

    const handleUserClick = (user) => {
        // console.log("User clicked:", user);
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    // Function to manually refresh current user (for testing)
    const refreshCurrentUser = () => {
        if (currentUser?.email) {
            refreshUserProfile(currentUser.email);
        }
    };

    // console.log("Users received (emails, for fetching):", users);
    // console.log("Connected Users (emails, for highlighting):", connectedUserEmails);
    // console.log("currentUser (full object):", currentUser);
    // console.log("All Displayable User Profiles (state):", allDisplayableUserProfiles);

    return (
        <div className="user-sidebar-list mt-4">
            {/* User Profile Modal */}
            <UserProfileModal
                user={selectedUser}
                isConnected={selectedUser ? connectedUserEmails.includes(selectedUser.email) : false}
                onClose={handleCloseModal}
            />

            {/* Debug buttons - remove in production */}
            <div className="flex gap-1 mb-2">
                <button
                    onClick={clearCache}
                    className="px-2 py-1 bg-rose-600 text-white text-xs rounded"
                    style={{ fontSize: '10px' }}
                >
                    Clear Cache
                </button>
                <button
                    onClick={refreshCurrentUser}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                    style={{ fontSize: '10px' }}
                >
                    Refresh Me
                </button>
            </div>

            {allDisplayableUserProfiles && allDisplayableUserProfiles.length > 0 ? (
                <ul>
                    {allDisplayableUserProfiles.map((user) => {
                        const isConnected = connectedUserEmails.includes(user.email);
                        const isCurrentUser = user.email === currentUser?.email;

                        let itemClasses = `
                            flex items-center gap-3 py-2 px-4 rounded-lg mb-2 cursor-pointer
                            transition-all duration-200 ease-in-out
                            transform hover:scale-[1.02] hover:shadow-lg
                            border-l-4
                        `;

                        if (isCurrentUser) {
                            itemClasses += " border-l-green-500 bg-green-800 text-white shadow-lg";
                        } else if (isConnected) {
                            itemClasses += " border-l-green-500 bg-green-800/50 text-white shadow-md";
                        } else {
                            itemClasses += " border-l-gray-600 bg-gray-800/30 text-gray-200 hover:bg-gray-700/50";
                        }

                        return (
                            <li
                                key={user.email} // Use email as key, it's unique
                                className={itemClasses}
                                onClick={() => handleUserClick(user)}
                            >
                                <img
                                    src={user.profilePicUrl || `${genericAvatarBaseUrl}${user.name?.charCodeAt(0) % 100 || 0}`}
                                    alt={user.name ? user.name.charAt(0) : 'U'}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-500 flex-shrink-0"
                                />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-semibold text-sm truncate">
                                        {user.name}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {isCurrentUser ? "You" : isConnected ? "Online" : "Offline"}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-gray-400 text-center text-sm">No users to display.</p>
            )}
        </div>
    );
};

export default UserSideBar;