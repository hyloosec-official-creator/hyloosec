import { io } from "socket.io-client";

const socket = io("https://node.hyloosec.online", {
  path: "/socket.io/", // सर्वर के Server(server, { path: "/socket.io/" }) से मैच होना चाहिए
  transports: ["websocket"],
  secure: true
});

// const socket = io("http://localhost:5000", {
//   path: "/socket.io/", // सर्वर के Server(server, { path: "/socket.io/" }) से मैच होना चाहिए
//   transports: ["websocket"],
//   secure: true
// });

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