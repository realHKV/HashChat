

const genericAvatarBaseUrl = "https://avatar.iran.liara.run/public/";

const UserProfileModal = ({ user, isConnected, onClose }) => {
    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                    aria-label="Close Profile"
                >
                    &times;
                </button>

                {/* Profile Content */}
                <div className="text-center">
                    {/* Profile Picture */}
                    <div className="mb-4">
                        <img
                            src={user.profilePicUrl || `${genericAvatarBaseUrl}${user.name?.charCodeAt(0) % 100 || 0}`}
                            alt={user.name}
                            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-rose-500"
                        />
                    </div>

                    {/* Name */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {user.name}
                    </h2>

                    {/* Email */}
                    <p className="text-gray-300 mb-3">
                        {user.email}
                    </p>

                    {/* Connection Status */}
                    <div className="mb-4">
                        <span className={`
                            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${isConnected 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }
                        `}>
                            <div className={`
                                w-2 h-2 rounded-full mr-2
                                ${isConnected ? 'bg-green-500' : 'bg-gray-400'}
                            `}></div>
                            {isConnected ? 'Connected to Room' : 'Not Connected'}
                        </span>
                    </div>

                    {/* Description */}
                    {user.description && user.description.trim() !== '' ? (
                        <div className="text-left">
                            <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                            <p className="text-gray-300 leading-relaxed">
                                {user.description}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-400 italic">
                                No description available
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;