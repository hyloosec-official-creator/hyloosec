import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchChats = createAsyncThunk("chat/fetchChats", async () => {
  const response = await axios.get("/api/chats");
  return response.data;
});

const priority = {
  sending: 0,
  sent: 1,
  delivered: 2,
  seen: 3,
};

const initialState = {
  chats: [],
  activeChatId: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
      // When opening a chat, find it and reset unread count locally
      const chat = state.chats.find(
        (c) => String(c.id) === String(action.payload),
      );
      if (chat) chat.unreadCount = 0;
    },

    updateUserStatus: (state, action) => {
      const { userId, online, lastSeen } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(userId));
      if (chat) {
        chat.online = online;
        chat.lastSeen = lastSeen;
      }
    },

    setMessagesForChat: (state, action) => {
      const { chatId, messages } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(chatId));
      if (chat) {
        chat.messages = messages;
      }
    },

    openOrAddChat: (state, action) => {
      const newUser = action.payload;
      const chatId = newUser.userId || newUser.id;
      const existingChat = state.chats.find(
        (c) => String(c.id) === String(chatId),
      );

      if (!existingChat) {
        state.chats.unshift({
          id: chatId,
          name: newUser.username || `User ${chatId}`,
          avatar: newUser.profilePic || newUser.avatar || "",
          bio: newUser.bio || "",
          lastMsg: "New Conversation",
          lastMsgTime: new Date().toISOString(),
          messages: [],
          unreadCount: 0,
          online: false,
          lastSeen: null,
        });
      }
      state.activeChatId = chatId;
    },

    updateSidebarMessage: (state, action) => {
      const { chatId, message, currentUserId } = action.payload;
      if (!state.chats) state.chats = [];

      const chatIndex = state.chats.findIndex(
        (c) => String(c.id) === String(chatId),
      );

      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];
        if (!chat.messages) chat.messages = [];

        const isDuplicate = chat.messages.some(
          (m) =>
            (message._id && String(m._id) === String(message._id)) ||
            (message.messageId &&
              String(m.messageId) === String(message.messageId)),
        );

        if (!isDuplicate) {
          chat.messages.push(message);

          // FIX: Static string hatao, sirf object update karo
          chat.lastMsgObj = message;
          // lastMsg ko sirf tab update karo agar wo media file ho
          if (message.files?.length > 0) {
            chat.lastMsg = "📎 Attachment";
          } else {
            // Isse empty rakho ya current value rehne do, SidebarMsgPreview handles the rest
            chat.lastMsg = "";
          }

          chat.lastMsgTime = new Date().toISOString();
          chat.lastMessageStatus = message.status || "sent";
          chat.lastMessageSenderId = String(message.senderId);

          state.chats.splice(chatIndex, 1);
          state.chats.unshift(chat);
        }
      } else {
        // New Contact logic (Same fix here)
        state.chats.unshift({
          id: chatId,
          name: message.senderName || "New Contact",
          avatar: message.senderAvatar || "",
          lastMsg: message.files?.length > 0 ? "📎 Attachment" : "",
          lastMsgObj: message,
          lastMsgTime: new Date().toISOString(),
          messages: [message],
          unreadCount:
            String(message.senderId) !== String(currentUserId) ? 1 : 0,
          online: message.senderOnline || false,
          lastSeen: message.senderLastSeen || new Date().toISOString(),
          lastMessageStatus: message.status || "sent",
          lastMessageSenderId: String(message.senderId),
        });
      }
    },

    deleteMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(chatId));
      if (chat?.messages) {
        chat.messages = chat.messages.filter(
          (m) => (m.messageId || m._id) !== messageId,
        );
        if (chat.messages.length > 0) {
          const last = chat.messages[chat.messages.length - 1];
          const isMe =
            String(last.senderId) === String(state.auth?.user?.userId); // currentUserId access logic
          const hasEncryptedText = isMe
            ? last.textForSender
            : last.textForReceiver;
          chat.lastMsg = hasEncryptedText
            ? "🔐 Encrypted Message"
            : "📎 Attachment";
        } else {
          chat.lastMsg = "Message deleted";
        }
      }
    },

    updateMessageStatus: (state, action) => {
      const { chatId, messageId, status, newId, dbId } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(chatId));

      if (chat && chat.messages) {
        chat.messages = chat.messages.map((msg) => {
          const isMatch =
            String(msg.messageId) === String(messageId) ||
            String(msg._id) === String(dbId);
          if (isMatch) {
            const currentPriority = priority[msg.status] ?? -1;
            const newPriority = priority[status] ?? -1;
            return newPriority > currentPriority
              ? { ...msg, status, _id: newId || dbId || msg._id }
              : msg;
          }
          return msg;
        });

        const lastMsg = chat.messages[chat.messages.length - 1];
        const isLastMatch =
          lastMsg &&
          (String(lastMsg.messageId) === String(messageId) ||
            String(lastMsg._id) === String(dbId));
        if (isLastMatch) {
          chat.lastMessageStatus = status;
        }
      }
    },

    markAsSeen: (state, action) => {
      const { chatId, currentUserId } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(chatId));
      if (chat && chat.messages) {
        chat.unreadCount = 0;
        chat.messages = chat.messages.map((msg) => {
          if (
            String(msg.senderId) !== String(currentUserId) &&
            msg.status !== "seen"
          ) {
            return { ...msg, status: "seen" };
          }
          return msg;
        });
        chat.lastMessageStatus = "seen";
      }
    },

    bulkUpdateMessageStatus: (state, action) => {
      const { chatId, status, safe } = action.payload;
      const chat = state.chats.find((c) => String(c.id) === String(chatId));

      if (chat && chat.messages) {
        if (
          !chat.lastMessageStatus ||
          priority[status] > priority[chat.lastMessageStatus]
        ) {
          chat.lastMessageStatus = status;
        }

        chat.messages = chat.messages.map((msg) => {
          if (safe && msg.status === "seen") return msg;
          if (priority[status] > priority[msg.status]) {
            return { ...msg, status };
          }
          return msg;
        });
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        const serverChats = action.payload || [];
        state.chats = serverChats.map((serverChat) => {
          const existing = state.chats.find(
            (c) => String(c.id) === String(serverChat.id),
          );
          return {
            ...serverChat,
            id: serverChat.id || serverChat._id,
            lastMsgObj: existing?.lastMsgObj || serverChat.lastMsgObj || null,
          };
        });
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setChats,
  setActiveChat,
  updateUserStatus,
  setMessagesForChat,
  openOrAddChat,
  updateSidebarMessage,
  deleteMessage,
  deleteForMe,
  bulkUpdateMessageStatus,
  updateMessageStatus,
  markAsSeen,
} = chatSlice.actions;

export default chatSlice.reducer;
