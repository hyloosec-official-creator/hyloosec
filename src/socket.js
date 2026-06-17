import { io } from "socket.io-client";

// वही लॉजिक जो तुम्हारे API फाइल में है
const USE_LOCAL_SERVER = false; 

const SOCKET_URL = USE_LOCAL_SERVER 
  ? "http://localhost:5000" 
  : import.meta.env.VITE_MONGO_API_URL; // यहाँ अपनी प्रोडक्शन वाली URL डालें

// Create the socket instance
const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export default socket;