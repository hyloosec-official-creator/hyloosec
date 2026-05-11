import { io } from "socket.io-client";

// This must match your Server's port (5000)
const URL = "https://hyloosec-node-backend.onrender.com";

// Create the socket instance
const socket = io(URL, {
  autoConnect: false, // We connect manually in Home.jsx
});

// CRITICAL: This "default" export fixes the error in Home.jsx
export default socket;