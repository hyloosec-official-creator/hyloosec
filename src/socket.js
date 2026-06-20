import { io } from "socket.io-client";

const socket = io("https://node.hyloosec.online", {
  path: "/socket.io/",
  // इसे ["polling", "websocket"] पर सेट करो, ताकि अगर websocket फेल हो तो polling से काम चल जाए
  transports: ["polling", "websocket"], 
  withCredentials: true,
  autoConnect: false,
});

socket.io.on("error", (error) => {
  console.log("Socket Global Error:", error);
});

socket.on("connect_error", (err) => {
  console.log("Connection Failed:", err.message);
});

export default socket;