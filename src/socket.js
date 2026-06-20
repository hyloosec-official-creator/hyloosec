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

socket.on("connect", () => console.log("🚀 Socket Connected ID:", socket.id));
socket.on("connect_error", (err) => {
  console.error("❌ Socket Connect Error (Detailed):", err.message);
  // अगर एरर में 'No cookies' या 'Invalid token' आ रहा है, तो साफ पता चल जाएगा
});
socket.io.on("reconnect_attempt", (attempt) => console.log("🔄 Reconnect attempt:", attempt));

socket.io.on("error", (error) => {
  console.log("Socket Global Error:", error);
});

socket.on("connect_error", (err) => {
  console.log("Connection Failed:", err.message);
});

export default socket;