import { useNavigate } from "react-router";
import chatIcon from '../assets/chat.png';

const AboutPage = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); // Go back to the previous page in history
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full border border-gray-700 space-y-8 p-8 sm:p-10 bg-gray-800 rounded-xl shadow-lg z-10 text-center">
                <img src={chatIcon} alt="HashChat Icon" className="mx-auto h-20 w-auto mb-6" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-rose-500 mb-4">
                    About HashChat
                </h1>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">
                    HashChat is a modern, real-time chat application designed for seamless and instant communication. Whether you want to connect with friends, collaborate with colleagues, or simply join a public discussion, HashChat provides a fast and intuitive platform.
                </p>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">
                    Key features include:
                </p>
                <ul className="list-disc list-inside text-left text-gray-400 mb-8 max-w-md mx-auto space-y-2">
                    <li>Real-time messaging with instant delivery.</li>
                    <li>Secure user authentication and profile management.</li>
                    <li>Ability to create and join custom chat rooms.</li>
                    <li>Responsive design for a consistent experience across devices.</li>
                    <li>User-friendly interface for easy navigation.</li>
                </ul>
                <button
                    onClick={handleBack}
                    className="w-full sm:w-auto py-2 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default AboutPage;