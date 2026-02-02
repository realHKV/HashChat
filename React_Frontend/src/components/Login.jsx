import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import { Link, useNavigate } from "react-router";
import chatIcon from '../assets/chat.png'
import { toast } from "react-hot-toast";
import { loginApi } from "../services/RoomService";
import { MdMenu, MdVisibility, MdVisibilityOff } from "react-icons/md";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login: authLogin, isAuthenticated } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    // const { setRoomId, setConnected } = useChatContext(); // Unused, can be removed if not needed here

    useEffect(() => {
        if (isAuthenticated) {
            console.log('User is authenticated, redirecting to home.');
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const responseData = await loginApi(email, password);

            if (responseData && responseData.token) {
                // console.log("loginApi successful, token:", responseData.token);
                await authLogin(responseData.token);
                // toast.success("Login successful!");
            } else {
                toast.error("Login failed: No token received.");
            }
        } catch (error) {
            // console.error("Login error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(`Login failed: ${error.response.data.error}`);
            } else {
                toast.error("Login failed. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
        // console.log('Login button clicked');
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
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 px-4 sm:px-6 lg:px-8 relative"> 
            {/* About HashChat Button (top-right corner) */}
            <Link
                to="/about"
                className="fixed top-4 right-4 p-2 text-white font-extrabold text-lg sm:text-xl bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg z-40 flex items-center justify-center"
                aria-label="About HashChat"
            >
                {/* <MdMenu className="text-2xl" /> */}
                <span className="hidden sm:inline">About HashChat</span>
                <span className="sm:hidden">About</span> {/* Abbreviation for small screens */}
            </Link>

            <div className="max-w-md w-full border border-gray-700 space-y-8 p-10 bg-gray-800 rounded-xl z-10"
                 style={{
                     boxShadow: '10px 10px 20px rgba(77, 9, 255, 0.1), -10px -10px 20px rgba(44, 0, 156, 0.1)'
                 }}> 
                <div className="text-center">
                    <img src={chatIcon} alt="Chat Icon" className="mx-auto h-16 w-auto mb-4" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-100">
                        Welcome To HashChat !
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Sign in to your account
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-md relative block w-full px-4 py-2 border border-gray-600 placeholder-gray-500 text-gray-100 bg-gray-700 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative"> {/* Added relative positioning to the container */}
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            type={showPassword ? "text" : "password"} // Toggle type based on showPassword state
                            id="password"
                            className="mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 bg-gray-700 text-gray-100 pr-10" // Add padding-right for the icon
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button" // Important: set to button to prevent form submission
                            onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-100"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
                <div className="flex flex-col items-center space-y-4 mt-6">
                    {/* The About button was moved from here */}
                    <p className="text-center text-sm text-gray-400">
                        Don't have an account? <Link to="/signup" className="font-medium text-rose-500 hover:text-rose-400">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;