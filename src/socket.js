import { io } from "socket.io-client";

// वही लॉजिक जो तुम्हारे API फाइल में है
const socket = io("https://node.hyloosec.online", {
  path: "/socket.io/",        // यह डिफ़ॉल्ट होता है, इसे रखें
  transports: ["websocket"],  // प्रोडक्शन पर सीधा websocket ही बेस्ट है
  withCredentials: true,
  autoConnect: false
});

socket.io.on("error", (error) => {
  console.log("Socket Global Error:", error);
});

socket.on("connect_error", (err) => {
  console.log("Connection Failed:", err.message);
});

export default socket;