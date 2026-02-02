import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { verifyEmailApi, resendOtpApi } from '../services/RoomService';
// import { useAuth } from './AuthContext';
import chatIcon from '../assets/chat.png';
import { useAuth } from '../context/AuthContext';

const EmailVerification = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    
    // Get email from navigation state
    const email = location.state?.email;
    
    // If no email in state, redirect to signup
    useEffect(() => {
        if (!email) {
            toast.error("Please complete the signup process first.");
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleVerification = async (e) => {
        e.preventDefault();
        
        if (!otp) {
            toast.error("Please enter the OTP.");
            return;
        }
        
        if (otp.length !== 6) {
            toast.error("OTP must be 6 digits long.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await verifyEmailApi(email, otp);
            authLogin(response.token); // Store token using AuthContext
            toast.success("Email verified successfully! Welcome to HashChat!");
            navigate('/'); // Redirect to JoinRoom page (which is now the home route)
        } catch (error) {
            console.error("Verification error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("An error occurred during verification. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            const response = await resendOtpApi(email);
            toast.success(response.message);
        } catch (error) {
            console.error("Resend OTP error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("Failed to resend OTP. Please try again.");
            }
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return null; // Component will redirect, so return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <img src={chatIcon} alt="Chat Icon" className="w-24 mx-auto mb-6 rounded-full" />
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    Verify Your Email
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    We've sent a 6-digit code to <span className="font-semibold">{email}</span>
                </p>
                
                <form onSubmit={handleVerification} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            id="otp"
                            maxLength="6"
                            placeholder="123456"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow digits
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Didn't receive the code?
                    </p>
                    <button
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="font-medium text-rose-600 hover:text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResending ? 'Resending...' : 'Resend OTP'}
                    </button>
                </div>
                
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Want to use a different email?{' '}
                    <button
                        onClick={() => navigate('/signup')}
                        className="font-medium text-rose-600 hover:text-rose-500"
                    >
                        Go back to signup
                    </button>
                </p>
            </div>
        </div>
    );
};

export default EmailVerification;