import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'react-hot-toast';
import { signupApi } from '../services/RoomService';
import chatIcon from '../assets/chat.png';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';


const Signup = () => {
    const [details, setDetails] = useState({
        name: '', 
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    // Consolidated input change handler for all fields
    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!details.name.trim()){
            toast.error("Please enter your name.");
            return false;
        }
        if (!details.email.trim() || !details.password.trim() || !details.confirmPassword.trim()) {
            toast.error("Please fill in all fields.");
            return false;
        }
        if (details.password !== details.confirmPassword) {
            toast.error("Passwords do not match.");
            return false;
        }
        if (details.password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return false;
        }
        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await signupApi(details.email, details.password, details.name);
            toast.success(response.message);
            navigate('/verify-email', { state: { email: details.email } });
        } catch (error) {
            console.error("Signup error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("An error occurred during signup. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
            <div className="min-h-screen flex p-8 items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"style={{
                     boxShadow: '10px 10px 20px rgba(77, 9, 255, 0.1), -10px -10px 20px rgba(44, 0, 156, 0.1)'
                 }}>
                    <img src={chatIcon} alt="Chat Icon" className="w-24 mx-auto mb-6 " />
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Sign Up</h2>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                                value={details.name}
                                onChange={handleFormInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email" // Important for handleFormInputChange
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                                value={details.email}
                                onChange={handleFormInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password" // Important for handleFormInputChange
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                                value={details.password}
                                onChange={handleFormInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword" 
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                                value={details.confirmPassword}
                                onChange={handleFormInputChange}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account? <Link to="/login" className="font-medium text-rose-600 hover:text-rose-500">Login</Link>
                    </p>
                </div>
            </div>
        );
    };
    
    export default Signup;