import { io } from "socket.io-client";

// वही लॉजिक जो तुम्हारे API फाइल में है
const USE_LOCAL_SERVER = false; 

const SOCKET_URL = USE_LOCAL_SERVER 
  ? "http://localhost:5000" 
  : import.meta.env.VITE_MONGO_API_URL; // यहाँ अपनी प्रोडक्शन वाली URL डालें

// Create the socket instance
const socket = io(SOCKET_URL, {
  timeout: 5000, // 5 सेकंड के बाद पक्का एरर दे
  reconnectionAttempts: 3, // 3 बार के बाद हार मान ले
  transports: ["polling", "websocket"],
  autoConnect: false,
  withCredentials: true,
});

socket.io.on("error", (error) => {
  console.log("Socket Global Error:", error);
});

socket.on("connect_error", (err) => {
  console.log("Connection Failed:", err.message);
});

export default socket;