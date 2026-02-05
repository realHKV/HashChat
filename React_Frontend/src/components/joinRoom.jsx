import React, { useCallback, useEffect } from 'react'
import chatIcon from "../assets/chat.png"
import { useState } from 'react'
import toast from 'react-hot-toast'
import { createRoom as createRoomApi, recordRoomVisitApi } from '../services/RoomService'
import {useChatContext} from '../context/ChatContext'
import { Link, useNavigate } from 'react-router'
import { joinChatApi,getRoomHistoryApi } from '../services/RoomService'
import { useAuth } from '../context/AuthContext'
import ImagePreviewModal from './ImagePreviewModal'
import { MdMenu } from 'react-icons/md'
import {HashLoader} from 'react-spinners'

const JoinRoom = () => {
    // console.log("JoinRoom")
    const defaultUserPic = "https://avatar.iran.liara.run/public/43";

   // Destructure 'name' from useChatContext and rename it to avoid conflict 
   const {  currentUser: chatContextUserName,
            roomId: contextRoomId,
            setRoomId,
            setCurrentUser,
            setConnected
    } = useChatContext();
    const { userProfile, loadingAuth ,logout} = useAuth();
    const navigate = useNavigate();
    const [previewImage,setPreviewImage] = useState("");
    const [loading, setLoading] = useState(false); //for form loading

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [prevRooms, setPrevRooms] = useState([]); // State to store previously joined rooms
    const [loadingHistory, setLoadingHistory] = useState(true); // Loading state for history

   const [details,setDetails] = useState({
     // Set initial 'name' to the context user's name, or an empty string if null/undefined 
     name: userProfile?.name || chatContextUserName || "",
     roomId:""
   })

   useEffect(() => {
       // Only update if userProfile is loaded and its name is different from current form name
       // And also make sure we are not loading authentication (profile has been fetched)
       if (!loadingAuth && userProfile && userProfile.name && details.name !== userProfile.name) {
           setDetails(prevDetails => ({
               ...prevDetails,
               name: userProfile.name
           }));
       }
   }, [userProfile, loadingAuth, details.name]);


   // Effect to fetch previously joined rooms when userProfile is available
    useEffect(() => {
        const fetchRoomHistory = async () => {
            if (userProfile && !loadingAuth) { // Ensure userProfile is loaded and auth is done
                setLoadingHistory(true);
                try {
                    const history = await getRoomHistoryApi(10); // Fetch top 10 rooms
                    setPrevRooms(history);
                } catch (error) {
                    console.error("Error fetching room history:", error);
                    toast.error("Failed to load room history.");
                } finally {
                    setLoadingHistory(false);
                }
            } else if (!loadingAuth && !userProfile) {
                // If auth is done but no userProfile, likely not logged in or profile not completed
                setPrevRooms([]); // Clear any previous rooms if not logged in
                setLoadingHistory(false);
            }
        };

        fetchRoomHistory();
    }, [userProfile, loadingAuth]); // Rerun when userProfile or loadingAuth changes



   function handleFormInputChange(event){
        setDetails({
            ...details,
            [event.target.name]:event.target.value
        })
   }

   function validateForm(){
    if(details.name==="" || details.roomId===""){ 
        toast.error("Invalid Inputs !!")
        return false
    }
    return true
   }

   async function joinRoom(){
    if(validateForm()){
        setLoading(true); // Start loading
        try {
            const room = await joinChatApi(details.roomId); //return room object
            toast.success("Room Joined Successfully !!");
            
            await recordRoomVisitApi(room.id);

            setCurrentUser(details); 
            setRoomId(details.roomId);
            setConnected(true);

            navigate("/chat");
        } catch (error) {
            // Check if error.response exists before accessing its properties
            if (error.response && error.response.data) {
                // Assuming the backend sends a plain string error message for 4xx errors
                toast.error(error.response.data || "Failed to join room.");
            } else if (error.message) {
                toast.error(`Error joining room: ${error.message}`);
            } else {
                toast.error("Error in joining room !!");
            }
            // Removed console.error
        } finally {
            setLoading(false); // End loading
        }
    }
   }

   async function createRoom(){
    if(validateForm()){
        setLoading(true); // Start loading
        try {
            const response = await createRoomApi(details.roomId);
            toast.success("Room Created Successfully !!");
            
            await recordRoomVisitApi(response.id);
            setCurrentUser(userProfile); // Make sure to update context with the name from the form
            setRoomId(response.roomId);
            setConnected(true);
            navigate("/chat");
        } catch (error) {
            if (error.response && error.response.data) {
                // Assuming the backend sends a plain string error message for 4xx errors
                toast.error(error.response.data || "Failed to create room.");
            } else if (error.message) {
                toast.error(`Error creating room: ${error.message}`);
            } else {
                toast.error("Error in creating room !!"); 
            }
            // Removed console.error
        } finally {
            setLoading(false); // End loading
        }
    }
}

   // New handler for clicking on a previous room in the sidebar
    const handleSelectPrevRoom = (roomIdToJoin) => {
        setDetails(prevDetails => ({
            ...prevDetails,
            roomId: roomIdToJoin // Populate the roomId input field
        }));
        // Optionally, automatically join the room after selecting
        // You might want to ask for confirmation or just populate and let user click Join
        // joinRoom(); // This would trigger an immediate join
        setIsSidebarOpen(false); // Close sidebar after selection
    };


   const handleEditProfile = () => {
       navigate('/profile'); 
       // Optionally close the sidebar after clicking
       setIsSidebarOpen(false); 
   };

   const handleLogout = () => {
       logout(); 
       // AuthContext's logout already handles navigation to /login and clearing state
       setIsSidebarOpen(false); // Close sidebar on logout
   };

   const openImagePreview = (imageUrl) => {
        setPreviewImage(imageUrl);
    };

    const handleAboutClick = useCallback(() => {
        // console.log('About button clicked');
        navigate('/about');
        // console.log('Navigated to /about');
    }, [navigate]);

// Add these variables/hooks at the top of your component
    const [touchStart, setTouchStart] = React.useState(null);
    const [touchEnd, setTouchEnd] = React.useState(null);

    // Minimum distance required to trigger a swipe
    const minSwipeDistance = 50; 

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
    
        // If user swipes left more than 50px, close the sidebar
        if (isLeftSwipe) {
            setIsSidebarOpen(false);
        }
    };
       
  return (
        <div className="min-h-screen flex bg-gray-900 text-gray-100">
            {/* Image Preview Modal */}
            <ImagePreviewModal
                src={previewImage}
                onClose={() => setPreviewImage(null)}
            />

            {/* Sidebar Container */}
            <div onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`
                fixed top-0 left-0 h-full bg-gray-800 dark:bg-gray-950 text-white
                transform transition-transform duration-300 ease-in-out z-50
                w-64 sm:w-64 md:w-72 lg:w-80 xl:w-96
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                overflow-hidden flex flex-col
            `}>
                

                {/* Sidebar Header: HASHCHAT title */}
                <div className="py-4 px-4 bg-gray-900 dark:bg-gray-950 relative shadow-md ">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500 text-center flex-grow">HASHCHAT</h2>
                </div>
                
                {/* Close Sidebar Button (Moved here for alignment) */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                    aria-label="Close Sidebar"
                >
                    &times;
                </button>

                {/* Sidebar Content */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto">
                    {/* User Profile Section */}
                    <div className="mb-6 text-center">
                        <img
                            src={userProfile?.profilePicUrl || defaultUserPic}
                            alt="User Profile"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto object-cover border-2 border-rose-500 cursor-pointer mb-2"
                            onClick={() => openImagePreview(userProfile?.profilePicUrl)}
                        />
                        <h3 className="text-lg sm:text-xl font-semibold mt-2 truncate">
                            {userProfile?.name || "Guest User"}
                        </h3>
                        {userProfile?.email && (
                            <p className="text-sm text-gray-400 truncate">
                                {userProfile.email}
                            </p>
                        )}
                    </div>
                    
                    {/* Profile Actions */}
                    <div className="flex flex-col gap-3 mt-4 border-t border-gray-700 pt-4">
                        <button
                            onClick={handleEditProfile}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 text-base sm:text-lg"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition duration-200 text-base sm:text-lg"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Previously Joined Rooms */}
                    <h4 className="text-base sm:text-lg font-medium mb-3 mt-6 text-gray-300 border-b border-gray-700 pb-2">Previously Joined Rooms</h4>
                    <ul className="space-y-2">
                        {loadingHistory ? (
                            <li className="p-2 text-gray-400 text-sm">Loading history...</li>
                        ) : prevRooms.length === 0 ? (
                            <li className="p-2 text-gray-400 text-sm">No recent rooms found.</li>
                        ) : (
                            prevRooms.map(room => (
                                <li
                                    key={room.id}
                                    onClick={() => handleSelectPrevRoom(room.roomId)}
                                    className="p-3 bg-gray-700 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-600 dark:hover:bg-gray-700 text-white text-base break-words shadow-sm flex items-center justify-between"
                                >
                                    <span>{room.roomId}</span>
                                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Toggle Button for sidebar (top-left) - Moved outside the main content area */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className={`fixed top-4 left-4 p-2 text-white font-extrabold text-lg sm:text-xl bg-rose-600 hover:bg-rose-700 rounded-md shadow-lg z-40 flex items-center justify-center ${isSidebarOpen ? 'hidden' : ''}`}
                aria-label="Open Sidebar"
            >
                <MdMenu className="text-2xl pr-2" />
                <span className="hidden sm:inline">HASHCHAT</span>
                <span className="sm:hidden">HASHCHAT</span>
            </button>

            {/* About Page Button (top-right) */}
            <Link
                to="/aboutPage"
                className="fixed top-4 right-4 p-2 text-white font-extrabold text-lg sm:text-xl bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg z-40 flex items-center justify-center"
                aria-label="About HashChat"
            >
                <span className="hidden sm:inline">About HashChat</span>
                <span className="sm:hidden">About</span> {/* Abbreviation for small screens */}
            </Link>


            {/* Main Content Area */}
            <div className={`
                flex-grow flex flex-col items-center justify-center min-h-screen
                transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'ml-0 sm:ml-64 md:ml-72 lg:ml-80 xl:ml-96' : 'ml-0'}
                py-20 px-4
            `}
            style={{
                boxShadow: '10px 10px 20px rgba(77, 9, 255, 0.1), -10px -10px 20px rgba(44, 0, 156, 0.1)'
            }}>
                <div className="bg-gray-900 border p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm md:max-w-md lg:max-w-lg">
                    <img src={chatIcon} className="w-20 sm:w-24 mx-auto mb-6" alt="Chat Icon"/>
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-blue-400">Join Room / Create Room</h1>
                    
                    {/* Your Name Input */}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-300 text-sm sm:text-base font-semibold mb-2">Your Name</label>
                        <input
                            onChange={handleFormInputChange}
                            value={details.name}
                            name="name"
                            placeholder="Enter your name"
                            type="text"
                            id="name"
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            disabled={loading}
                        />
                    </div>
                    
                    {/* Room ID Input */}
                    <div className="mb-6">
                        <label htmlFor="roomId" className="block text-gray-300 text-sm sm:text-base font-semibold mb-2">Room ID / New Room ID</label>
                        <input
                            onChange={handleFormInputChange}
                            value={details.roomId}
                            name="roomId"
                            placeholder='Enter room ID'
                            type="text"
                            id="roomId"
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            disabled={loading}
                        />
                    </div>
                    
                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={joinRoom}
                                className="w-full bg-rose-400 border text-white font-bold py-3 px-4 rounded-lg hover:bg-rose-600 transition duration-300 ease-in-out flex items-center justify-center text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? <HashLoader color="#fff" size={20} /> : "Join Room"}
                            </button>
                            <button
                                onClick={createRoom}
                                className="w-full bg-rose-600 border text-white font-bold py-3 px-4 rounded-lg hover:bg-rose-950 transition duration-300 ease-in-out flex items-center justify-center text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? <HashLoader color="#fff" size={20} /> : "Create Room"}
                            </button>
                        </div>

                    <p className="text-center text-gray-400 text-sm sm:text-base mt-6">
                        New to HashChat?{" "}
                        <Link to="/profile" className="text-blue-400 hover:underline">
                            Complete your profile!
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default JoinRoom;