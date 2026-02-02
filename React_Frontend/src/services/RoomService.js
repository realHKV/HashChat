import HttpClient from "../config/AxiosHelper";


export const createRoom = async (roomId) => {
  try {
    const response = await HttpClient.post(`/api/v1/rooms`, roomId, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
    return response.data; // Return data on success
  } catch (error) {
    // console.error("Error creating room:", error); // Use console.error for errors
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const joinChatApi = async (roomId) => {
  try {
    const response = await HttpClient.get(`/api/v1/rooms/${roomId}`);
    return response.data; // Return data on success
  } catch (error) {
    // console.error("Error joining room:", error); // Use console.error for errors
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const getMessagess = async (roomId, size = 50, page = 0) => {
  const response = await HttpClient.get(
    `/api/v1/rooms/${roomId}/messages?size=${size}&page=${page}`
  );
  return response.data;
};

export const getProfileByEmailApi = async (email) => {
    try{
      const response = await HttpClient.get(`/api/v1/user/profile-by-email?email=${email}`);
      // console.log("getProfileByEmailApi:",response.data);
      return response.data;
    }catch(error){
      console.log("Error fetching profile for", email, error);
      throw error;
    } 
}

// Auth APIs
export const signupApi = async (email, password,name) => {
    const response = await HttpClient.post('/api/v1/auth/signup', { email, password, name });
    return response.data;
};

export const verifyEmailApi = async (email, otp) => {
    const response = await HttpClient.post('/api/v1/auth/verify-email', { email, otp });
    return response.data;
};

export const loginApi = async (email, password) => {
    const response = await HttpClient.post('/api/v1/auth/login', { email, password });
    // console.log("loginApi:",response.data);
    return response.data;
};

export const resendOtpApi = async (email) => {
    const response = await HttpClient.post('/api/v1/auth/resend-otp', { email });
    return response.data;
};

// User Profile API (requires authentication)
export const getProfileApi = async () => {
    // HttpClient already adds the token from localStorage
    const response = await HttpClient.get('/api/v1/user/profile');
    // console.log("getProfileApi:",response.data);
    return response.data;
};

export const getRoomHistoryApi = async (limit = 10) => {
    // HttpClient should automatically attach the JWT token from localStorage
    const response = await HttpClient.get(`/api/v1/user/rooms/history?limit=${limit}`);
    return response.data; // This will be the list of Room objects
};

export const getPastRoomUsersApi = async (roomMongoId) => {
    try {
        const response = await HttpClient.get(`/api/v1/user/room/${roomMongoId}/past-users`);
        return response.data; // Should return an array of simplified user profile objects
    } catch (error) {
        console.error("Error fetching past room users:", error);
        throw error; // Re-throw to be caught by the component
    }
};

export const recordRoomVisitApi = async (roomMongoId) => {
    // HttpClient should automatically attach the JWT token from localStorage
    const response = await HttpClient.post(`/api/v1/user/rooms/visit/${roomMongoId}`);
    return response.data; // The backend should return the UserRoomMembership object
};

export const updateProfileApi = async (formData) => {
    // When sending FormData for file uploads, ensure Content-Type is not set to application/json
    // Axios will automatically set it to multipart/form-data when a FormData object is passed
    const response = await HttpClient.put('/api/v1/user/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// export const checkUsernameApi = async (username) => {
//     const response = await HttpClient.get(`/api/v1/user/check-username?username=${username}`);
//     return response.data;
// };