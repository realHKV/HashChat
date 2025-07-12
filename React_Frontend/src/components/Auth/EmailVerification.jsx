import React, { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import { setToken } from '../../utils/auth';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

  const EmailVerification = ({ email, onVerificationSuccess }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!otp || otp.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);
      try {
        const response = await authAPI.verifyEmail(email, otp);
        setToken(response.data.token);
        toast.success('Email verified successfully!');
        onVerificationSuccess();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await authAPI.resendOTP(email);
      toast.success('OTP sent successfully!');
      setTimeLeft(600); // Reset timer
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-lg font-mono tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              maxLength="6"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              {timeLeft > 0 ? (
                <span className="text-gray-600">
                  Code expires in {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-red-600">Code expired</span>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !otp || otp.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Verify Email'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || timeLeft > 0}
              className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? <LoadingSpinner size="sm" /> : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailVerification;