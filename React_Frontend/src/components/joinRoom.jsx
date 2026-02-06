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
    // UPDATED: Using UI Avatars instead of the broken link
    const defaultUserPic = "https://ui-avatars.com/api/?name=User&background=random&color=fff&bold=true";

   const {  currentUser: chatContextUserName,
            roomId: contextRoomId,
            setRoomId,
            setCurrentUser,
            setConnected
    } = useChatContext();
    const { userProfile, loadingAuth ,logout} = useAuth();
    const navigate = useNavigate();
    const [previewImage,setPreviewImage] = useState("");
    const [loading, setLoading] = useState(false); 

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [prevRooms, setPrevRooms] = useState([]); 
    const [loadingHistory, setLoadingHistory] = useState(true); 

   const [details,setDetails] = useState({
     name: userProfile?.name || chatContextUserName || "",
     roomId:""
   })

   useEffect(() => {
       if (!loadingAuth && userProfile && userProfile.name && details.name !== userProfile.name) {
           setDetails(prevDetails => ({
               ...prevDetails,
               name: userProfile.name
           }));
       }
   }, [userProfile, loadingAuth, details.name]);


    useEffect(() => {
        const fetchRoomHistory = async () => {
            if (userProfile && !loadingAuth) { 
                setLoadingHistory(true);
                try {
                    const history = await getRoomHistoryApi(10); 
                    setPrevRooms(history);
                } catch (error) {
                    console.error("Error fetching room history:", error);
                    toast.error("Failed to load room history.");
                } finally {
                    setLoadingHistory(false);
                }
            } else if (!loadingAuth && !userProfile) {
                setPrevRooms([]); 
                setLoadingHistory(false);
            }
        };

        fetchRoomHistory();
    }, [userProfile, loadingAuth]);

   function handleFormInputChange(event){
        setDetails({ ...details, [event.target.name]:event.target.value })
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
        setLoading(true); 
        try {
            const room = await joinChatApi(details.roomId); 
            toast.success("Room Joined Successfully !!");
            await recordRoomVisitApi(room.id);
            setCurrentUser(details); 
            setRoomId(details.roomId);
            setConnected(true);
            navigate("/chat");
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data || "Failed to join room.");
            } else if (error.message) {
                toast.error(`Error joining room: ${error.message}`);
            } else {
                toast.error("Error in joining room !!");
            }
        } finally {
            setLoading(false);
        }
    }
   }

   async function createRoom(){
    if(validateForm()){
        setLoading(true); 
        try {
            const response = await createRoomApi(details.roomId);
            toast.success("Room Created Successfully !!");
            await recordRoomVisitApi(response.id);
            setCurrentUser(userProfile);
            setRoomId(response.roomId);
            setConnected(true);
            navigate("/chat");
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data || "Failed to create room.");
            } else if (error.message) {
                toast.error(`Error creating room: ${error.message}`);
            } else {
                toast.error("Error in creating room !!"); 
            }
        } finally {
            setLoading(false);
        }
    }
}

    const handleSelectPrevRoom = (roomIdToJoin) => {
        setDetails(prevDetails => ({
            ...prevDetails,
            roomId: roomIdToJoin 
        }));
        setIsSidebarOpen(false); 
    };

   const handleEditProfile = () => {
       navigate('/profile'); 
       setIsSidebarOpen(false); 
   };

   // FIX: Only call logout(). Context handles redirection to '/'
   const handleLogout = () => {
       logout(); 
   };

   const openImagePreview = (imageUrl) => {
        setPreviewImage(imageUrl);
    };

    // Swipe logic
    const [touchStart, setTouchStart] = React.useState(null);
    const [touchEnd, setTouchEnd] = React.useState(null);
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
        if (isLeftSwipe) { setIsSidebarOpen(false); }
    };

  return (
        <div className="min-h-screen flex bg-gray-900 text-gray-100">
            <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />

            <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            className={`
                fixed top-0 left-0 h-full bg-gray-800 dark:bg-gray-950 text-white
                transform transition-transform duration-300 ease-in-out z-50
                w-64 sm:w-64 md:w-72 lg:w-80 xl:w-96
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                overflow-hidden flex flex-col
            `}>
                <div className="py-4 px-4 bg-gray-900 dark:bg-gray-950 relative shadow-md ">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500 text-center flex-grow">HASHCHAT</h2>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                    aria-label="Close Sidebar"
                >
                    &times;
                </button>

                <div className="flex-grow p-4 md:p-6 overflow-y-auto">
                    <div className="mb-6 text-center">
                        <img
                            // UPDATED: Safe Avatar URL
                            src={userProfile?.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || "User")}&background=random&color=fff&bold=true`}
                            alt="User Profile"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto object-cover border-2 border-rose-500 cursor-pointer mb-2"
                            onClick={() => openImagePreview(userProfile?.profilePicUrl)}
                            onError={(e) => {e.target.src = defaultUserPic}}
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
                    
                    <div className="flex flex-col gap-3 mt-4 border-t border-gray-700 pt-4">
                        <button
                            onClick={() => navigate('/global')}
                            className="w-full py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition duration-200 text-base sm:text-lg"
                        >
                            Join Global Chat
                        </button>
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

            <button
                onClick={() => setIsSidebarOpen(true)}
                className={`fixed top-4 left-4 p-2 text-white font-extrabold text-lg sm:text-xl bg-rose-600 hover:bg-rose-700 rounded-md shadow-lg z-40 flex items-center justify-center ${isSidebarOpen ? 'hidden' : ''}`}
                aria-label="Open Sidebar"
            >
                <MdMenu className="text-2xl pr-2" />
                <span className="hidden sm:inline">HASHCHAT</span>
                <span className="sm:hidden">HASHCHAT</span>
            </button>

            <Link
                to="/aboutPage"
                className="fixed top-4 right-4 p-2 text-white font-extrabold text-lg sm:text-xl bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg z-40 flex items-center justify-center"
                aria-label="About HashChat"
            >
                <span className="hidden sm:inline">About HashChat</span>
                <span className="sm:hidden">About</span> 
            </Link>

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