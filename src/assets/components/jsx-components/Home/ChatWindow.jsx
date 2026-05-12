import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { CiUser } from "react-icons/ci";
import { PiSealCheckLight, PiSealCheckFill } from "react-icons/pi";
import "./ChatWindow.css";
import { encryptText, decryptText } from "../../../../utils/cryptoUtils.js";
import UserInfo from "./chatWindowChilds/UserInfo";
import FileMessage from "./chatWindowChilds/FileMessage";
import {
  removeChatFile,
  removeSingleFile,
} from "../../../../store/slices/fileSlice";

import {
  deleteMessage,
  deleteForMe,
  updateMessageStatus,
  bulkUpdateMessageStatus,
} from "../../../../store/slices/chatSlice";
import socket from "../../../../socket";

const getMessageDateLabel = (date) => {
  const now = new Date();
  const msgDate = new Date(date);

  // Reset hours to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  const checkDate = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate(),
  );

  if (checkDate.getTime() === today.getTime()) return "Today";
  if (checkDate.getTime() === yesterday.getTime()) return "Yesterday";

  return msgDate.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const DecryptedText = ({ text, privateKey }) => {
  const [decrypted, setDecrypted] = useState("Decrypting...");

  useEffect(() => {
    const handleDecrypt = async () => {
      if (!text) return;
      const result = await decryptText(text, privateKey);
      setDecrypted(result || text);
    };
    handleDecrypt();
  }, [text, privateKey]);

  return <p>{decrypted}</p>;
};

const ChatWindow = ({
  activeChat,
  activeFile = [],
  onFileSelect = () => {},
  onSendMessage,
  uploadProgress,
  onBack,
  isTyping = false,
}) => {
  /* ================= STATE ================= */
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // For Lightbox
  const [decryptedCache, setDecryptedCache] = useState({});

  const scrollRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null); // Input field ke liye ref
  const chatContainerRef = useRef(null); // Main window ke liye ref

  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  /* ================= DERIVED DATA ================= */
  const displayName = activeChat?.name || "User";
  const displayId = activeChat?.id;
  const messages = activeChat?.messages || [];
  const myId = currentUser?.user?.userId || currentUser?.userId;
  const isInitialLoad = useRef(true);

  /* ================= EFFECTS ================= */

  // Scroll to bottom whenever messages change or a new chat is selected
  useEffect(() => {
    if (messages.length > 0) {
      // If it's a brand new chat, jump to bottom instantly
      // If it's just a new message, scroll smoothly
      const scrollBehavior = isInitialLoad.current ? "auto" : "smooth";

      // RequestAnimationFrame is more reliable than setTimeout for DOM updates
      const handleScroll = () => {
        scrollRef.current?.scrollIntoView({
          behavior: scrollBehavior,
          block: "end", // Ensures it aligns to the bottom of the container
        });
        isInitialLoad.current = false;
      };

      const timer = setTimeout(handleScroll, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, displayId]); // Added displayId to reset context

  useEffect(() => {
    const handleStatusUpdate = ({ chatId, messageId, status, newId, dbId }) => {
      // Use String() to ensure IDs match the Redux logic
      dispatch(
        updateMessageStatus({
          chatId: String(chatId),
          messageId: String(messageId),
          status,
          newId: newId ? String(newId) : undefined,
          dbId,
        }),
      );
    };

    const handleBulkStatusUpdate = ({ chatId, status, safe }) => {
      dispatch(
        bulkUpdateMessageStatus({
          chatId,
          status,
          safe: safe || false, // default false
        }),
      );
    };

    socket.on("message_status_updated", handleStatusUpdate);
    socket.on("message_status_sync", handleBulkStatusUpdate); // Listen for the sync

    return () => {
      socket.off("message_status_updated", handleStatusUpdate);
      socket.off("message_status_sync", handleBulkStatusUpdate);
    };
  }, [dispatch]); // Removed displayId so it stays active for all chats

  useEffect(() => {
    // 1. Mobile Keyboard Fix logic
    const handleVisualViewportResize = () => {
      if (window.visualViewport && chatContainerRef.current) {
        // Keyboard khulne par height ko update karega
        const offset = window.innerHeight - window.visualViewport.height;
      chatContainerRef.current.style.bottom = `${offset}px`;

        // Agar keyboard khula hai (height kam hui hai), toh bottom par scroll karo
        if (window.visualViewport.height < window.innerHeight) {
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportResize,
      );
    }

    window.visualViewport?.addEventListener("resize", handleVisualViewportResize);
  return () => window.visualViewport?.removeEventListener("resize", handleVisualViewportResize);
  }, []);

  const handleInputFocus = () => {
    // Keyboard khulne mein thoda time lagta hai, isliye delay
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  };

  useEffect(() => {
    if (displayId && myId) {
      socket.emit("open_chat", { userId: myId, chatId: displayId });

      return () => {
        socket.emit("close_chat", myId);
      };
    }
  }, [displayId, myId]);

  useEffect(() => {
    if (!displayId || !myId || messages.length === 0) return;

    // ✅ ONLY run when this chat is actively open
    if (String(activeChat?.id) !== String(displayId)) return;

    const unseenMessages = messages.filter(
      (msg) =>
        String(msg.senderId) === String(displayId) && msg.status !== "seen",
    );

    if (unseenMessages.length > 0) {
      socket.emit("mark_chat_as_seen", {
        chatId: displayId,
        myId: myId,
      });

      dispatch(
        bulkUpdateMessageStatus({
          chatId: displayId,
          status: "seen",
          safe: false,
        }),
      );
    }
  }, [displayId, messages.length, myId, activeChat?.id, dispatch]);

  /* ================= HANDLERS ================= */

  const handleSendMessage = async () => {
    if (inputText.trim() === "" && activeFile.length === 0) return;
    if (!activeChat?.publicKey) {
      console.error("Encryption fail: Receiver ki public key nahi mili!");
      return;
    }

    try {
      const receiverPubKey = activeChat.publicKey;
      const myPubKey = currentUser.publicKey || currentUser.user.publicKey;

      const encryptedForReceiver = await encryptText(inputText, receiverPubKey);
      const encryptedForSender = await encryptText(inputText, myPubKey);

      const timestamp = Date.now();
      const generatedId = `${myId}_${displayId}_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

      const newMessage = {
        messageId: generatedId,
        textForReceiver: encryptedForReceiver,
        textForSender: encryptedForSender,
        timestamp: timestamp,
        files: activeFile.map((f) => ({
          preview: f.preview,
          fileType: f.type,
          name: f.name,
        })),
        senderId: myId, // Use senderId consistently
        receiverId: displayId,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      };

      onSendMessage(displayId, newMessage);
      if (activeFile.length > 0)
        dispatch(removeChatFile({ chatId: displayId }));
      setInputText("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Encryption error: ", err);
    }
  };

  const handleDelete = (msg) => {
    const msgId = msg.messageId || msg._id;
    const isMe = String(msg.senderId) === String(myId);

    if (isMe) {
      // <--- Use the 'isMe' variable you already calculated
      if (window.confirm("Unsend for everyone?")) {
        dispatch(deleteMessage({ chatId: displayId, messageId: msgId }));
        socket.emit("unsend_message", {
          messageId: msgId,
          receiverId: displayId,
          senderId: myId,
        });
      }
    } else {
      if (window.confirm("Delete for me?")) {
        dispatch(deleteForMe({ chatId: displayId, messageId: msgId }));
      }
    }
  };

  /* ================= RENDER HELPERS ================= */

  const renderMessageFiles = (msg) => (
    <div className="msg-files-grid">
      {msg.files?.map((f, i) => {
        const isMe = String(msg.senderId) === String(myId);
        const actualType = f.type || f.fileType;
        const fileKey = f.url || f.preview;

        return (
          <div
            key={i}
            className="file-attachment-preview"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewMedia({
                preview: decryptedCache[fileKey] || f.url || f.preview,
                actualType: actualType,
              });
            }}
          >
            {f.url ? (
              <FileMessage
                file={f}
                isMe={isMe}
                privateKey={
                  currentUser?.privateKey || currentUser?.user?.privateKey
                }
                onDecrypt={(url) => {
                  setDecryptedCache((prev) => ({ ...prev, [fileKey]: url }));
                }}
              />
            ) : (
              <div className="local-sending-preview">
                {actualType?.startsWith("image/") && (
                  <img
                    src={f.preview}
                    className="chat-media-cover"
                    alt={f.name}
                  />
                )}

                {actualType?.startsWith("video/") && (
                  <div className="video-cover-container">
                    <video src={f.preview} className="chat-media-cover" muted />
                    <div className="play-overlay">
                      <i className="ph-fill ph-play-circle"></i>
                    </div>
                  </div>
                )}

                {actualType?.includes("pdf") && (
                  <div className="pdf-cover-card">
                    <i className="ph ph-file-pdf"></i>
                    <div className="pdf-info">
                      <span className="pdf-name">
                        {f.name || "Document.pdf"}
                      </span>
                      <span className="pdf-action">Sending...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const formatLastSeen = (dateString) => {
    if (!dateString) return "last seen long ago";

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffInDays === 0) return `last seen today at ${timeStr}`;
    if (diffInDays === 1) return `last seen yesterday at ${timeStr}`;
    if (diffInDays < 7)
      return `last seen ${date.toLocaleDateString([], { weekday: "long" })} at ${timeStr}`;

    return `last seen ${date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" })}`;
  };

  /* ================= EMPTY STATE ================= */
  if (!activeChat) {
    return (
      <main className="chat-window placeholder-view">
        <div className="chat-placeholder">
          <i className="ph ph-chats-teardrop"></i>
          <h2>Select a conversation</h2>
        </div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main className="chat-window">
      {/* ---------- MEDIA LIGHTBOX (FULLSCREEN) ---------- */}
      {/* ---------- MEDIA LIGHTBOX (FULLSCREEN) ---------- */}
      {previewMedia && (
        <div className="media-lightbox" onClick={() => setPreviewMedia(null)}>
          <button
            className="close-lightbox"
            onClick={() => setPreviewMedia(null)}
          >
            ×
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* IMAGE BIG VIEW */}
            {previewMedia.actualType?.startsWith("image/") && (
              <img
                src={previewMedia.preview}
                alt=""
                style={{
                  maxWidth: "90vw",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            )}

            {/* VIDEO BIG VIEW - This is where the actual play happens */}
            {previewMedia.actualType?.startsWith("video/") && (
              <video
                src={previewMedia.preview}
                controls
                autoPlay
                style={{ width: "auto", maxHeight: "auto" }}
              />
            )}

            {/* PDF BIG VIEW */}
            {previewMedia.actualType?.includes("pdf") && (
              <div
                className="pdf-internal-viewer"
                style={{ height: "80vh", width: "100%" }}
              >
                <object
                  data={previewMedia.preview}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                >
                  <iframe
                    src={previewMedia.preview}
                    title="pdf-viewer"
                    style={{ border: "none", width: "100%", height: "100%" }}
                  >
                    <p>
                      Your browser does not support PDFs.
                      <a href={previewMedia.preview}>Download instead</a>.
                    </p>
                  </iframe>
                </object>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <header className="chat-header">
        <div className="user-meta" onClick={() => setIsUserInfoOpen(true)}>
          <button
            className="mobile-back-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
          >
            <i className="ph ph-caret-left"></i>
          </button>

          <div className="header-avatar-wrapper">
            {activeChat.avatar ? (
              <img
                src={activeChat.avatar}
                className="header-avatar-img"
                alt=""
              />
            ) : (
              <CiUser size={22} />
            )}
          </div>

          <div className="header-text-meta">
            <h3>{displayName}</h3>
            {activeChat?.online ? (
              <span className="online-status">online</span>
            ) : (
              <span className="last-seen">
                {formatLastSeen(activeChat?.lastSeen)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ---------- CONTENT AREA ---------- */}
      {isUserInfoOpen ? (
        <UserInfo
          activeChat={activeChat}
          onClose={() => setIsUserInfoOpen(false)}
        />
      ) : (
        <>
          {/* ---------- MESSAGE AREA ---------- */}
          <section className="message-area">
            {messages.map((msg, index) => {
              // Added index

              const isMe = String(msg.senderId) === String(myId);

              // 2. Sahi field pick karein decryption ke liye
              const textToDecrypt = isMe
                ? msg.textForSender
                : msg.textForReceiver;

              const hasFiles = msg.files && msg.files.length > 0;

              // 3. Validation fix: Agar koi bhi encrypted text ya file hai tabhi dikhayein
              if (!textToDecrypt && (!msg.files || msg.files.length === 0)) {
                return null;
              }

              const currentMsgDate = msg.timestamp
                ? new Date(msg.timestamp)
                : new Date();
              const dateLabel = getMessageDateLabel(currentMsgDate);

              let showDateHeader = false;
              if (index === 0) {
                showDateHeader = true; // Always show for the first message
              } else {
                const prevMsg = messages[index - 1];
                const prevMsgDate = prevMsg.timestamp
                  ? new Date(prevMsg.timestamp)
                  : new Date();

                // If the date string (e.g., "10/04/2026") is different, show header
                if (
                  new Date(currentMsgDate).toDateString() !==
                  new Date(prevMsgDate).toDateString()
                ) {
                  showDateHeader = true;
                }
              }

              const formatBytes = (bytes, decimals = 1) => {
                if (!bytes || bytes === 0) return "0 B";
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ["B", "KB", "MB", "GB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return (
                  parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
                  " " +
                  sizes[i]
                );
              };

              return (
                <React.Fragment key={`${msg._id || msg.messageId}-${index}`}>
                  {showDateHeader && (
                    <div className="chat-date-separator">
                      <span>{dateLabel}</span>
                    </div>
                  )}

                  <div className={`msg ${isMe ? "sent" : "received"}`}>
                    {hasFiles && (
                      <div className="msg-files-container">
                        {renderMessageFiles(msg)}
                      </div>
                    )}
                    {!hasFiles && textToDecrypt && (
                      <div className="msg-text-wrapper">
                        <DecryptedText
                          text={textToDecrypt}
                          privateKey={
                            currentUser?.privateKey ||
                            currentUser?.user?.privateKey
                          }
                        />
                      </div>
                    )}
                    <div className="msg-footer">
                      <div className="msg-info-wrapper">
                        <span>
                          {msg.time ||
                            (msg.timestamp &&
                              new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }))}
                        </span>
                        {isMe && (
                          <span className="msg-status-tick">
                            {msg.status === "sending" ? (
                              <div className="upload-data-info">
                                {/* FIX: Better check for progress data */}
                                {uploadProgress && uploadProgress.total > 0 ? (
                                  <span className="progress-text-bytes">
                                    {formatBytes(uploadProgress.loaded)} /{" "}
                                    {formatBytes(uploadProgress.total)}
                                  </span>
                                ) : (
                                  <div className="upload-preparing">
                                    <i className="ph ph-circle-notch animate-spin"></i>
                                    <small>Preparing...</small>
                                  </div>
                                )}
                              </div>
                            ) : msg.status === "seen" ? (
                              <PiSealCheckFill
                                size={16}
                                className="seen-tick"
                              />
                            ) : msg.status === "delivered" ? (
                              <PiSealCheckFill
                                size={16}
                                className="delivered-tick"
                              />
                            ) : (
                              <PiSealCheckLight size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {isTyping && (
              <div className="msg received typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={scrollRef} style={{ float: "left", clear: "both" }} />
          </section>
          {/* ---------- INPUT AREA ---------- */}
          <footer className="chat-input">
            {/* Multi-File Upload Preview */}
            {activeFile.length > 0 && (
              <div className="multi-preview-wrapper">
                {activeFile.map((f, i) => (
                  <div key={i} className="file-preview-container">
                    {f.type?.startsWith("image/") ? (
                      <img src={f.preview} alt="preview" />
                    ) : f.type?.startsWith("video/") ? (
                      <video
                        src={f.preview}
                        className="video-thumbnail-preview"
                        muted
                      />
                    ) : (
                      <div className="document-thumbnail-preview">
                        <i className="ph ph-file-pdf"></i>
                      </div>
                    )}
                    <button
                      onClick={() =>
                        dispatch(
                          removeSingleFile({ chatId: displayId, index: i }),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="emoji-section">
              <label htmlFor="file-upload">
                <i className="ph ph-paperclip"></i>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                hidden
                accept="video/*, .png, .jpg, .jpeg, .pdf"
                onChange={(e) => {
                  onFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
              <i
                className="ph ph-smiley"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              ></i>

              {showEmojiPicker && (
                <div className="emoji-picker-container" ref={emojiPickerRef}>
                  <EmojiPicker
                    onEmojiClick={(emoji) =>
                      setInputText((prev) => prev + emoji.emoji)
                    }
                  />
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              onFocus={handleInputFocus}
              value={inputText}
              placeholder="Type a message..."
              onChange={(e) => {
                setInputText(e.target.value);

                // Emit Typing Event
                socket.emit("typing", {
                  receiverId: displayId,
                  senderId: myId,
                  typing: true,
                });

                // Stop typing after 2 seconds of inactivity
                if (typingTimeoutRef.current)
                  clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit("typing", {
                    receiverId: displayId,
                    senderId: myId,
                    typing: false,
                  });
                }, 2000);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />

            <button className="send-btn" onClick={handleSendMessage}>
              <i className="ph ph-paper-plane-tilt paper-send-button"></i>
            </button>
          </footer>
        </>
      )}
    </main>
  );
};

export default ChatWindow;
