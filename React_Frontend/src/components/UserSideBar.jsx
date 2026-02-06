import { useCallback, useEffect, useState } from "react";
import { getProfileByEmailApi } from "../services/RoomService";
import UserProfileModal from "./UserProfileModal";

// UPDATED: No longer using the broken base URL
const LOCAL_STORAGE_PROFILE_KEY = 'cachedUserProfiles';
const CACHE_VERSION = 'v2';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

const UserSideBar = ({ users, connectedUserEmails, currentUser, onProfilesUpdate }) => {
    const [allDisplayableUserProfiles, setAllDisplayableUserProfiles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Helper for safe avatars
    const getAvatarUrl = (name) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&bold=true`;
    };

    const isCacheValid = useCallback((cachedProfile) => {
        return cachedProfile &&
            cachedProfile.email &&
            cachedProfile.name &&
            cachedProfile.cacheVersion === CACHE_VERSION &&
            cachedProfile.timestamp &&
            (Date.now() - cachedProfile.timestamp) < CACHE_EXPIRY_MS;
    }, []);

    const refreshUserProfile = useCallback(async (userEmail) => {
        const cachedProfiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)) || {};
        if (cachedProfiles[userEmail]) {
            delete cachedProfiles[userEmail];
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(cachedProfiles));
        }

        if (users && users.includes(userEmail)) {
            fetchAndCacheUserProfiles(users);
        }
    }, [users]);

    useEffect(() => {
        const handleProfileUpdate = (event) => {
            const { email } = event.detail;
            refreshUserProfile(email);
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, [refreshUserProfile]);

    useEffect(() => {
        if (currentUser && currentUser.email) {
            refreshUserProfile(currentUser.email);
        }
    }, [currentUser, refreshUserProfile]);

    const fetchAndCacheUserProfiles = useCallback(async (userEmailsToProcess) => {
        const cachedProfiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)) || {};
        const newProfilesMap = {};

        const profilesToFetch = [];

        userEmailsToProcess.forEach(email => {
            if (email === currentUser?.email) {
                newProfilesMap[email] = {
                    id: currentUser.id,
                    email: currentUser.email,
                    name: currentUser.name,
                    profilePicUrl: currentUser.profilePicUrl,
                    description: currentUser.description || '',
                };
            } else if (isCacheValid(cachedProfiles[email])) {
                newProfilesMap[email] = cachedProfiles[email];
            } else {
                profilesToFetch.push(email);
            }
        });

        if (profilesToFetch.length > 0) {
            const fetchedResponses = await Promise.allSettled(
                profilesToFetch.map(email => getProfileByEmailApi(email))
            );

            fetchedResponses.forEach((result, index) => {
                const email = profilesToFetch[index];
                if (result.status === 'fulfilled' && result.value) {
                    const profileData = result.value;

                    if (profileData.name && profileData.name.trim() !== '') {
                        newProfilesMap[email] = {
                            id: profileData.id,
                            email: profileData.email,
                            name: profileData.name,
                            profilePicUrl: profileData.profilePicUrl || null,
                            description: profileData.description || '',
                            cacheVersion: CACHE_VERSION,
                            timestamp: Date.now()
                        };
                    } else {
                        newProfilesMap[email] = {
                            id: null,
                            email: email,
                            name: email.split('@')[0],
                            profilePicUrl: null,
                            description: '',
                            isTemporary: true
                        };
                    }
                } else {
                    newProfilesMap[email] = {
                        id: null,
                        email: email,
                        name: email.split('@')[0],
                        profilePicUrl: null,
                        description: '',
                        isTemporary: true
                    };
                }
            });

            const profilesToCache = {};
            Object.keys(newProfilesMap).forEach(email => {
                if (!newProfilesMap[email].isTemporary && newProfilesMap[email].email === email) {
                    profilesToCache[email] = newProfilesMap[email];
                }
            });

            if (Object.keys(profilesToCache).length > 0) {
                const updatedCache = { ...cachedProfiles, ...profilesToCache };
                localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedCache));
            }
        }

        const finalSortedUserProfiles = Object.values(newProfilesMap).sort((a, b) => {
            const aIsConnected = connectedUserEmails.includes(a.email);
            const bIsConnected = connectedUserEmails.includes(b.email);

            if (a.email === currentUser?.email) return -1;
            if (b.email === currentUser?.email) return 1;

            if (aIsConnected && !bIsConnected) return -1;
            if (!aIsConnected && bIsConnected) return 1;

            return a.name.localeCompare(b.name);
        });

        setAllDisplayableUserProfiles(prev => {
            if (JSON.stringify(prev) === JSON.stringify(finalSortedUserProfiles)) {
                return prev;
            }
            return finalSortedUserProfiles;
        });
    }, [currentUser, isCacheValid, connectedUserEmails]);

    useEffect(() => {
        if (users && users.length > 0) {
            fetchAndCacheUserProfiles(users);
        } else {
            setAllDisplayableUserProfiles([]);
        }
    }, [users, currentUser, fetchAndCacheUserProfiles]);

    useEffect(() => {
        if (onProfilesUpdate) {
            onProfilesUpdate(allDisplayableUserProfiles);
        }
    }, [allDisplayableUserProfiles, onProfilesUpdate]);

    const clearCache = () => {
        localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        if (users && users.length > 0) {
            fetchAndCacheUserProfiles(users);
        } else {
            setAllDisplayableUserProfiles([]);
        }
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    const refreshCurrentUser = () => {
        if (currentUser?.email) {
            refreshUserProfile(currentUser.email);
        }
    };

    return (
        <div className="user-sidebar-list mt-4">
            <UserProfileModal
                user={selectedUser}
                isConnected={selectedUser ? connectedUserEmails.includes(selectedUser.email) : false}
                onClose={handleCloseModal}
            />

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
                                key={user.email} 
                                className={itemClasses}
                                onClick={() => handleUserClick(user)}
                            >
                                <img
                                    // UPDATED: Using fallback logic
                                    src={user.profilePicUrl || getAvatarUrl(user.name)}
                                    alt={user.name ? user.name.charAt(0) : 'U'}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-500 flex-shrink-0"
                                    onError={(e) => { e.target.src = getAvatarUrl(user.name); }}
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