import ChatWindow from "./Home/ChatWindow";
import SideBar from "./Home/SideBar";
import "../../css/Home.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSessionExpired } from "../../../Slice/authSlice";
import socket from "../../../socket";
import axios from "axios";
import { MongoAPI, JavaAPI } from "../../../api/api";
import {
  generateAESKey,
  encryptFileInChunks,
  encryptText,
  encryptFileName,
  uint8ArrayToBase64,
  generateSignature,
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

const Home = ({ activeTab }) => {
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sessionSecret, setSessionSecret] = useState(null);
  const isFetchingRef = useRef(false);

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
    if (activeChatId && chats.length > 0 && !isFetchingRef.current) {
      const targetChat = chats.find(
        (c) => String(c.id) === String(activeChatId),
      );

      if (
        targetChat &&
        (!targetChat.messages || targetChat.messages.length === 0)
      ) {
        console.log("Auto-restoring active chat...");
        isFetchingRef.current = true;
        handleSelectChat(activeChatId).finally(() => {
          isFetchingRef.current = false;
        });
      }
    }
  }, [activeChatId, chats]);

useEffect(() => {
    const initializeSidebar = async () => {
      if (!currentUser?.userId) return;

      // 1. CACHE: अगर डेटा लोकल स्टोरेज में है, तुरंत सेट करें (Instant UI)
      const cachedChats = localStorage.getItem(`chats_${currentUser.userId}`);
      if (cachedChats) {
        dispatch(setChats(JSON.parse(cachedChats)));
        setIsInitialLoading(false); // तुरंत लोडिंग बंद करें
      }

      setIsInitialLoading(true);
      
      try {
        const mongoRes = await MongoAPI.get(`/conversations/${currentUser.userId}`);
        const conversations = mongoRes.data;

        if (!Array.isArray(conversations) || conversations.length === 0) return;

        const contactIds = conversations.map((conv) =>
          conv.participants.find((id) => id !== currentUser.userId),
        );

        const javaRes = await JavaAPI.post("/user/bulk-profiles", contactIds);
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
            lastMessageStatus: mongoConv?.lastMessageStatus || "sent",
            lastMessageSenderId: mongoConv?.lastMessageSenderId,
            lastSeen: mongoConv?.lastSeen || null,
            online: mongoConv?.online || false,
            unreadCount: mongoConv?.unreadCount || 0,
            messages: [],
          };
        });

        // 2. SYNC: नया डेटा रेडक्स और लोकल स्टोरेज दोनों में सेव करें
        dispatch(setChats(formattedChats));
        localStorage.setItem(`chats_${currentUser.userId}`, JSON.stringify(formattedChats));
        
        socket.emit("request_online_users");
      } catch (err) {
        console.error("Initialization failed:", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          dispatch(setSessionExpired(true));
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeSidebar();
  }, [currentUser?.userId, dispatch]); // सिर्फ इनके बदलने पर ही कॉल होगा

  useEffect(() => {
    if (currentUser?.userId) {
      socket.auth = { userId: currentUser.userId };
      console.log("ye hai user id", socket.auth);
      socket.connect();
      socket.emit("join", currentUser.userId);

      socket.on("auth_handshake", (data) => {
        console.log("🔒 Security Handshake Successful: Key Received");
        setSessionSecret(data.secretKey);
      });

      socket.on("message_status_updated", (data) => {
        if (data.newId) {
          dispatch(
            updateMessageStatus({
              chatId: data.chatId,
              messageId: data.messageId, // tempId
              newId: data.newId, // DB ID
              status: data.status,
            }),
          );
        } else {
          dispatch(updateMessageStatus(data));
        }
      });

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
      });

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
        socket.disconnect();
      };
    }
  }, [currentUser?.userId, activeChatId, dispatch]);

  useEffect(() => {
    if (!currentUser?.userId) return;
    const syncInterval = setInterval(() => {
      socket.emit("request_online_users");
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [currentUser?.userId]);

  const handleSelectChat = useCallback(
    async (id) => {
      dispatch(setActiveChat(id));

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
          const res = await MongoAPI.get(
            `/messages/${currentUser.userId}/${id}?limit=50&skip=0`,
          );

          if (res.data) {
            dispatch(setMessagesForChat({ chatId: id, messages: res.data }));

            if (res.data.length > 0) {
              const lastMsg = res.data[res.data.length - 1];
              dispatch(
                updateSidebarMessage({
                  chatId: id,
                  message: lastMsg,
                  currentUserId: currentUser.userId,
                  isHistoryLoad: true,
                }),
              );
            }
          }
        } catch (err) {
          console.error("Database fetch failed:", err);
        }
      }
    },
    [chats, currentUser?.userId, dispatch],
  ); 

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
    const timestamp = Date.now();

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
          const aesKey = await generateAESKey();
          const encName = await encryptFileName(f.name, aesKey);
          const finalBlob = await encryptFileInChunks(f.rawFile, aesKey);

          const targetChat = chats.find((c) => String(c.id) === String(chatId));
          const exportedKey = await window.crypto.subtle.exportKey(
            "raw",
            aesKey,
          );
          const aesKeyBase64 = uint8ArrayToBase64(new Uint8Array(exportedKey));

          const encAesKeyForReceiver = await encryptText(
            aesKeyBase64,
            targetChat.publicKey,
          );
          const encAesKeyForSender = await encryptText(
            aesKeyBase64,
            currentUser.publicKey || currentUser.user.publicKey,
          );

          const formData = new FormData();
          formData.append("files", finalBlob, encName + ".enc");
          const mediaRes = await JavaAPI.post("/media/upload", formData);

          processedFiles.push({
            name: encName,
            url: mediaRes.data[0].url,
            type: f.type,
            size: f.size,
            encAesKeyForReceiver,
            encAesKeyForSender,
            originalExtension: f.name.split(".").pop(),
          });
        }
      }

      if (!sessionSecret) {
        console.log("🔒 Security Key not initialized yet!");
        console.error("🔒 Security Key not initialized yet!");
        return;
      }

      // 2. सिग्नेचर जनरेट करो
      const signature = await generateSignature(
        newMessage.textForReceiver,
        timestamp,
        currentUser.userId,
        sessionSecret,
      );

      // 3. सॉकेट पेलोड तैयार करो
      const messagePayload = {
        senderId: String(currentUser.userId),
        receiverId: String(chatId),
        textForReceiver: newMessage.textForReceiver,
        textForSender: newMessage.textForSender,
        files: processedFiles,
        messageId: tempId,
        timestamp: timestamp,
        signature: signature,
      };

      // 4. API की जगह सिर्फ सॉकेट का इस्तेमाल करो
      socket.emit("send_message", messagePayload);
      console.log("🚀 Message sent via socket:", messagePayload);

      // 5. फाइल क्लीनअप
      dispatch(removeChatFile({ chatId }));
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
