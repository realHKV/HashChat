import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import toast from 'react-hot-toast'
import JoinRoom from './components/joinRoom.jsx'
import { useRef } from 'react'
import HttpClient from './config/AxiosHelper.js'

function App() {
  const [count, setCount] = useState(0)

  const [isOnline, setIsOnline] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const wasOffline = useRef(false) // 🚨 initially false

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await HttpClient.get('/ping')
        // console.log("✅ Server response:", response)

        if (wasOffline.current) {
          // ✅ Previously offline, now connected
          toast.success("Connected to server")
          wasOffline.current = false
        }

        setIsOnline(true)
        setErrorMessage("")
      } catch (error) {
        console.error("❌ Error contacting server:", error.message)

        setIsOnline(false)

        if (!wasOffline.current) {
          wasOffline.current = true // 🚨 Mark as offline to detect reconnect
        }

        if (error.code === 'ECONNABORTED') {
          setErrorMessage("Server timed out. It may be offline.")
          toast.error("Server timed out. It may be offline.")
        } else if (error.message === "Network Error") {
          setErrorMessage("Cannot reach server. Check if it's running.")
          toast.error("Cannot reach server. Check if it's running.")
        } else {
          setErrorMessage(error.message)
        }
      }
    }

    checkServer()
    const interval = setInterval(checkServer, 10000)
    return () => clearInterval(interval)
  }, [])

  const { loadingAuth } = useAuth();
  
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // This component won't actually render content since routing handles everything
  // But we keep it for any global app logic
  return null;
}

export default App
