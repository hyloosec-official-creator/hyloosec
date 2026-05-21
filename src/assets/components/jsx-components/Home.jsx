import ChatWindow from "./Home/ChatWindow";
import SideBar from "./Home/SideBar";
import "../../css/Home.css";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../../../socket";
import axios from "axios";
import { MongoAPI, JavaAPI } from "../../../api/api";
import {
  generateAESKey,
  encryptFileNative,
  encryptText,
} from "../../../utils/cryptoUtils";
import { setBulkProfiles } from "../../../store/slices/userInfoSlice";
import { setChatFile, removeChatFile } from "../../../store/slices/fileSlice";
import {
  setActiveChat,
  setChats,
  updateSidebarMessage,
  updateMessageStatus,
  deleteMessage,
  bulkUpdateMessageStatus,
  setMessagesForChat,
  updateUserStatus,
  markAsSeen,
} from "../../../store/slices/chatSlice";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const Home = () => {
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);

  const { loading } = useSelector(
    (state) => state.sidebar || { loading: false },
  );
  const { chats, activeChatId } = useSelector(
    (state) => state.chat || { chats: [], activeChatId: null },
  );

  const isChatActive = activeChatId != null;

  const currentUser = useSelector((state) => state.auth.user);
  const allFiles =
    useSelector((state) => state.fileManager?.chatFiles) || EMPTY_OBJECT;

  const [showChat, setShowChat] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // Stores progress per ChatId
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Start as true
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isTyping, setIsTyping] = useState(false); // New state for typing indicator

  const activeFile = activeChatId
    ? allFiles[activeChatId] || EMPTY_ARRAY
    : EMPTY_ARRAY;

  // 1. INITIAL LOAD
  useEffect(() => {
    const initializeSidebar = async () => {
      setIsInitialLoading(true);
      console.log("Home Component Mounted. User ID:", currentUser?.userId);
      if (!currentUser?.userId) {
        console.warn("No user ID found, skipping sidebar init.");
        return;
      }
      try {
        const mongoRes = await MongoAPI.get(`/conversations/${currentUser.userId}`);
        console.log("Mongo Conversations Data:", mongoRes.data);
        const conversations = mongoRes.data;

        if (!Array.isArray(conversations) || conversations.length === 0) {
          console.log("No conversations found.");
          return;
        }

        if (conversations.length > 0) {
          const contactIds = conversations.map((conv) =>
            conv.participants.find((id) => id !== currentUser.userId),
          );

          const javaRes = await JavaAPI.post(
            "/user/bulk-profiles",
            contactIds,
          );
          dispatch(setBulkProfiles(javaRes.data));

          const formattedChats = javaRes.data.map((user) => {
            const mongoConv = conversations.find((c) =>
              c.participants.includes(user.userId),
            );
            return {
              id: user.userId,
              name: user.username,
              avatar: user.profilePic,
              bio: user.bio,
              publicKey: user.publicKey,
              lastMsg: mongoConv?.lastMessage || "No messages yet",
              lastMsgTime: mongoConv?.updatedAt || new Date().toISOString(),
              lastMsgObj: mongoConv?.lastMsgObj || null,
              lastMessageStatus: mongoConv?.lastMessageStatus || "sent", // PERSIST BLUE TICK
              lastMessageSenderId: mongoConv?.lastMessageSenderId,
              lastSeen: mongoConv?.lastSeen || null, // PERSIST LAST SEEN
              online: mongoConv?.online || false,
              unreadCount: mongoConv?.unreadCount || 0,
              messages: [],
            };
          });
          dispatch(setChats(formattedChats));
          socket.emit("request_online_users");
        } else {
          console.log("No conversations found for this user.");
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsInitialLoading(false); // Stop loading regardless of success/fail
      }
    };
    if (currentUser?.userId) initializeSidebar();
  }, [currentUser?.userId, dispatch]);

  useEffect(() => {
    if (currentUser?.userId) {
      socket.connect();
      socket.emit("join", currentUser.userId);

      socket.on("message_status_sync", (data) => {
        console.log("Status Sync Received:", data);
        dispatch(
          bulkUpdateMessageStatus({
            chatId: data.chatId,
            status: data.status,
          }),
        );
        dispatch(
          updateSidebarMessage({
            chatId: data.chatId,
            message: { status: data.status }, // This helps the sidebar tick update
            currentUserId: currentUser.userId,
          }),
        );
      });

      socket.on("user_status_changed", (data) => {
        dispatch(
          updateUserStatus({
            userId: data.userId,
            online: data.online,
            lastSeen: data.lastSeen,
          }),
        );
      });

      socket.on("get_online_users", (onlineIds) => {
        onlineIds.forEach((id) => {
          dispatch(updateUserStatus({ userId: id, online: true }));
        });
      });

      socket.on("message_status_updated", (data) => {
        console.log("Real-time Status Update Received:", data);
        dispatch(
          updateMessageStatus({
            chatId: String(data.chatId),
            messageId: String(data.messageId),
            status: data.status,
            dbId: data.dbId || data._id,
          }),
        );
        // dispatch(
        //   updateSidebarMessage({
        //     chatId: String(data.chatId),
        //     message: { status: data.status },
        //   }),
        // );
      });

      // ... inside the socket useEffect

      socket.on("receive_message", (data) => {
        // Ensure we don't process our own messages as "received"
        if (String(data.senderId) !== String(currentUser.userId)) {
          dispatch(
            updateSidebarMessage({
              chatId: String(data.senderId), // The key is the person WHO SENT it
              message: { ...data },
              currentUserId: currentUser.userId,
            }),
          );

          // Tell server message delivered
          socket.emit("message_delivered", {
            chatId: data.senderId,
            messageId: data._id,
            senderId: data.senderId,
          });

          // Auto-seen if this chat window is currently open
          if (String(activeChatId) === String(data.senderId)) {
            socket.emit("message_seen", {
              chatId: data.senderId,
              messageId: data._id,
              senderId: data.senderId,
            });
          }
        }
      });
      // TYPING LISTENERS
      socket.on("typing_status", ({ chatId, typing }) => {
        if (String(chatId) === String(activeChatId)) {
          setIsTyping(typing);
        }
      });

      socket.on("message_unsent", (data) => {
        dispatch(
          deleteMessage({ chatId: data.senderId, messageId: data.messageId }),
        );
      });

      return () => {
        socket.off("user_status_changed");
        socket.off("receive_message");
        socket.off("typing_status");
        socket.off("message_unsent");
        socket.off("message_status_updated");
        socket.off("message_status_sync"); // ✅ added
        socket.off("get_online_users");
      };
    }
  }, [currentUser?.userId, activeChatId, dispatch]);

  useEffect(() => {
    if (!currentUser?.userId) return;

    // This ensures that even if a socket event was missed during
    // a page load or tab switch, the UI "repaints" the online status regularly.
    const syncInterval = setInterval(() => {
      socket.emit("request_online_users");
    }, 3000); // I suggest 3 seconds for a snappier feel than 30

    return () => clearInterval(syncInterval);
  }, [currentUser?.userId]);

  const handleSelectChat = async (id) => {
    dispatch(setActiveChat(id));
    // setShowChat(true);
    console.log("Clicked chat:", id);

    // Check if we already have messages for this chat
    dispatch(
      markAsSeen({
        chatId: id,
        currentUserId: currentUser.userId,
      }),
    );

    socket.emit("mark_chat_as_seen", {
      chatId: id,
      myId: currentUser.userId,
    });
    const targetChat = chats.find((c) => String(c.id) === String(id));
    if (
      targetChat &&
      (!targetChat.messages || targetChat.messages.length === 0)
    ) {
      try {
        const res = await MongoAPI.get(`/messages/${currentUser.userId}/${id}`);

        // Ensure we pass BOTH the chatId and the messages
        dispatch(setMessagesForChat({ chatId: id, messages: res.data }));

        // ALSO: Update the sidebar's last message to match the last message from DB
        if (res.data.length > 0) {
          const lastMsg = res.data[res.data.length - 1];
          dispatch(
            updateSidebarMessage({
              chatId: id,
              message: lastMsg,
              currentUserId: currentUser.userId,
              isHistoryLoad: true, // Add a flag to prevent unread count logic
            }),
          );
        }
      } catch (err) {
        console.error("Database fetch failed:", err);
      }
    }
  };
  // FIXED: Implementation of handleFileSelect
  const handleFileSelect = (files) => {
    console.log("Files received in Home:", files); // <--- DEBUG HERE
    if (!activeChatId) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch(
          setChatFile({
            chatId: activeChatId,
            fileData: {
              preview: e.target.result,
              type: file.type,
              name: file.name,
              rawFile: file,
            },
          }),
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleNewMessage = async (chatId, newMessage) => {
    if (!currentUser?.userId) return;
    const tempId = `temp_${Date.now()}`;

    // 1. Sidebar ko "sending" status dikhao
    dispatch(
      updateSidebarMessage({
        chatId,
        message: { ...newMessage, messageId: tempId, status: "sending" },
        currentUserId: currentUser.userId,
      }),
    );

    try {
      let processedFiles = [];
      const filesToUpload = allFiles[chatId];

      if (filesToUpload && filesToUpload.length > 0) {
        for (let f of filesToUpload) {
          // A. AES Key generate karein (Native)
          const aesKey = await generateAESKey();

          // B. Native Chunk Encryption call karein
          const { finalBlob, aesKeyBase64, ivBase64 } = await encryptFileNative(
            f.rawFile,
            aesKey,
            (percent) => {
              setUploadProgress((prev) => ({
                ...prev,
                [chatId]: { percent, fileName: f.name },
              }));
            },
          );

          // C. RSA Encryption (Keys ke liye)
          const targetChat = chats.find((c) => String(c.id) === String(chatId));
          const encAesKeyForReceiver = await encryptText(
            aesKeyBase64,
            targetChat.publicKey,
          );
          const encAesKeyForSender = await encryptText(
            aesKeyBase64,
            currentUser.publicKey || currentUser.user.publicKey,
          );

          // D. Spring Boot Upload
          const formData = new FormData();
          formData.append("files", finalBlob, f.name + ".enc"); // extension badal di security ke liye

          const mediaRes = await JavaAPI.post(
            "/media/upload",
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          // E. Sabse Important: Metadata pack karna
          processedFiles.push({
            name: f.name,
            url: mediaRes.data[0].url,
            type: f.type,
            size: f.size,
            iv: ivBase64, // MongoDB mein save hoga
            encAesKeyForReceiver,
            encAesKeyForSender,
          });
        }
      }

      // 2. Final Payload to Node.js
      const response = await MongoAPI.post("/messages/send", {
        senderId: String(currentUser.userId),
        receiverId: String(chatId),
        textForReceiver: newMessage.textForReceiver,
        textForSender: newMessage.textForSender,
        files: processedFiles,
        messageId: tempId,
      });

      if (response.data) {
        dispatch(
          updateMessageStatus({
            chatId,
            messageId: tempId,
            newId: response.data._id,
            status: response.data.status,
          }),
        );
        socket.emit("send_message", {
          ...response.data,
          receiverId: String(chatId),
        });
        dispatch(removeChatFile({ chatId }));
      }
      setUploadProgress((prev) => ({ ...prev, [chatId]: 0 }));
    } catch (error) {
      console.error("Critical Error:", error);
      dispatch(
        updateMessageStatus({ chatId, messageId: tempId, status: "error" }),
      );
    }
  };

  const activeChat = chats?.find((c) => String(c.id) === String(activeChatId));

  return (
    <div className="home-container">
      {(!isMobile || !isChatActive) && (
        <aside className="sidebar">
          <SideBar
            chats={chats}
            activeChatId={activeChatId}
            onChatSelect={handleSelectChat}
            isLoading={isInitialLoading}
          />
        </aside>
      )}
      {(!isMobile || isChatActive) && (
        <ChatWindow
          activeChat={activeChat}
          activeFile={activeFile}
          onFileSelect={handleFileSelect} // Passed missing prop
          onSendMessage={handleNewMessage}
          isTyping={isTyping} // Passed missing prop
          uploadProgress={uploadProgress[activeChatId] || 0}
          onBack={() => dispatch(setActiveChat(null))} // ✅ PASS PROGRESS HERE
        />
      )}
    </div>
  );
};

export default Home;
