import React, { useState } from 'react';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import EmailVerification from './components/Auth/EmailVerification';
import ProfileBuilder from './components/Profile/ProfileBuilder';
import ProfileView from './components/Profile/ProfileView';
import LoadingSpinner from './components/Common/LoadingSpinner';
import Chat from './pages/Chat';

const AuthFlow = () => {
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'signup', 'verify'
  const [userEmail, setUserEmail] = useState('');

  const handleSignupSuccess = (email) => {
    setUserEmail(email);
    setCurrentStep('verify');
  };

  const handleVerificationSuccess = () => {
    window.location.reload(); // Refresh to update auth context
  };

  const handleLoginSuccess = () => {
    window.location.reload(); // Refresh to update auth context
  };

  switch (currentStep) {
    case 'signup':
      return (
        <Signup
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setCurrentStep('login')}
        />
      );
    case 'verify':
      return (
        <EmailVerification
          email={userEmail}
          onVerificationSuccess={handleVerificationSuccess}
        />
      );
    default:
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setCurrentStep('signup')}
        />
      );
  }
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  // // Directly check user.profileCompleted from the context
  // if (!user?.profileCompleted) {
  //   return (
  //     <ProfileBuilder
  //       // onProfileComplete is no longer setting a local state,
  //       // it relies on the user.profileCompleted in context becoming true
  //       onProfileComplete={() => { /* No specific action needed here if context updates */ }}
  //     />
  //   );
  // }
  //Show profile builder if profile is not completed
  if (!user?.profileCompleted || showProfileBuilder) {
    return (
      <ProfileBuilder
        onProfileComplete={() => setShowProfileBuilder(false)}
      />
    );
  }
  // if(user?.profileCompleted){
    // setShowProfileBuilder(false);
  // }
  return <Home />;
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/auth"
        element={
          !isAuthenticated ? <AuthFlow /> : <Navigate to="/" replace />
        }
      />
      {/* New Route for ProfileView */}
      <Route
        path="/profile"
        element={
          isAuthenticated ? <ProfileView /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/chat"
        element={
          isAuthenticated ? <Chat /> : <Navigate to="/auth" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  // useEffect(() => {
  //   document.title = "HashChat";
  // }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
