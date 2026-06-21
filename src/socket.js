import { io } from "socket.io-client";

const USE_LOCAL_SERVER = false; 

const SOCKET_URL = USE_LOCAL_SERVER 
  ? "http://localhost:5000" 
  : import.meta.env.VITE_MONGO_API_URL; 

  
const socket = io(SOCKET_URL, {
  path: "/socket.io/",
  transports: ["websocket"],
  secure: true,
  timeout: 5000, 
  reconnectionAttempts: 3, 
  autoConnect: false, 
  withCredentials: true,
});

socket.on("connect", () => console.log("🚀 Socket Connected ID:", socket.id));
socket.on("connect_error", (err) => {
  console.error("❌ Socket Connect Error (Detailed):", err.message);
});
socket.io.on("reconnect_attempt", (attempt) => console.log("🔄 Reconnect attempt:", attempt));

socket.io.on("error", (error) => {
  console.log("Socket Global Error:", error);
});

socket.on("connect_error", (err) => {
  console.log("Connection Failed:", err.message);
});

export default socket;