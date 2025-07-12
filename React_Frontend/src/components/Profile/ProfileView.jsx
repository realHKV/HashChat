import React, { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


const ProfileView = () => {

  const Navigate=useNavigate();

  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    description: '',
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("ProfileView - User from AuthContext:", user)
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        description: user.description || '',
      });
      setProfilePicPreview(user.profilePicUrl ? `http://localhost:8080${user.profilePicUrl}` : null);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setProfilePic(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      //formDataToSend.append('username', formData.username);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (profilePic) {
        formDataToSend.append('profilePic', profilePic);
      }

      const response = await userAPI.updateProfile(formDataToSend);

      // console.log("ProfileView - Backend Response Data:", response.data); // Inspect backend response
      // console.log("ProfileView - User object from backend response:", response.data.user); // Inspect the user object from backend

      
      // Use response.data directly, as backend returns the user object not user.data
      setUser(response.data); // This is the corrected line
      

      // console.log("ProfileView - User after setUser (should trigger re-render):", user); 
      // setUser(response.data.user);
      setIsEditing(false);
      setProfilePic(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      name: user.name || '',
      description: user.description || '',
    });
    setProfilePicPreview(user.profilePicUrl ? `http://localhost:8080${user.profilePicUrl}` : null);
    setProfilePic(null);
    setIsEditing(false);
  };

  // New handler for going to Home
  const handleGoHome = () => {
    Navigate('/'); // Navigate to the root path, which is your Home component
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
            {/* Added Home button here */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Home
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
              Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            {!isEditing ? (
              // View Mode
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <img
                      className="h-24 w-24 rounded-full object-cover"
                      src={profilePicPreview || 'https://via.placeholder.com/96x96?text=Profile'}
                      alt="Profile"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="mt-1 text-sm text-gray-900">@{user.username}</p>
                    </div>
                  </div>

                  {user.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <p className="mt-1 text-sm text-gray-900">{user.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                  <div className="space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-6">
                      <img
                        className="h-24 w-24 rounded-full object-cover"
                        src={profilePicPreview || 'https://via.placeholder.com/96x96?text=Profile'}
                        alt="Profile preview"
                      />
                      <label className="block">
                        <span className="sr-only">Choose profile photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username ( fixed )
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                        value={formData.username}
                        // onChange={handleChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center'>Home</button> */}
    </div>
  );
};

export default ProfileView;