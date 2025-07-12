import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home= ()=>{
    const navigate = useNavigate();
    const {user,logout}=useAuth();

    const handleGoToProfile = () => {
        navigate('/profile'); // We'll add this route in App.jsx
    };

    const handleGoToChat = () => {
        // Implement navigation to your chat page
        navigate('/chat');
        // For now, let's just show an alert or navigate to a placeholder
        //alert('Hash Chat feature coming soon!');
        // navigate('/chat'); // If you have a chat route
    };

    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || user?.username}!</h1>
          <button
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-80  text-center m-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Explore</h2>
          <div className="space-y-4">
            <button
              onClick={handleGoToChat}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Go to Hash Chat
            </button>
            <button
              onClick={handleGoToProfile}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Profile Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;