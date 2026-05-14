import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import logo from "../../../images/logo/logo.png";
import { CiSearch, CiUser, CiChat1 } from "react-icons/ci";
import SearchBar from "../SideNav/SearchBar";
import { PiSealCheckLight, PiSealCheckFill } from "react-icons/pi";
import "./SideBar.css";
import { decryptText } from "../../../../utils/cryptoUtils";

const SidebarMsgPreview = ({ chat, currentUserId, privateKey }) => {
  const [displayText, setDisplayText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    const getPreview = async () => {
      const msg = chat.lastMsgObj;

      // 1. Agar encrypted data hai toh Loader dikhao
      if (msg && (msg.textForSender || msg.textForReceiver)) {
        setIsDecrypting(true); // START LOADER
        try {
          const isMe = String(msg.senderId) === String(currentUserId);
          const encryptedText = isMe ? msg.textForSender : msg.textForReceiver;

          if (encryptedText && privateKey) {
            const decrypted = await decryptText(encryptedText, privateKey);
            if (decrypted) {
              setDisplayText(
                decrypted.length > 25
                  ? decrypted.substring(0, 25) + "..."
                  : decrypted,
              );
              setIsDecrypting(false); // STOP LOADER
              return;
            }
          } else if (encryptedText && !privateKey) {
            setIsDecrypting(true);
            return;
          }
        } catch (err) {
          console.error("Decryption failed", err);
        }
      }
      // 2. Priority 2: Agar media hai
      if (chat.lastMsg === "📎 Attachment") {
        setDisplayText("📎 Attachment");
        setIsDecrypting(false);
        return;
      }

      // 3. Priority 3: Agar sirf purana static text hai (without object)
      if (chat.lastMsg && chat.lastMsg.length < 50) {
        setDisplayText(chat.lastMsg);
      } else {
        setDisplayText("No messages yet");
      }
      setIsDecrypting(false);
    };

    getPreview();
  }, [chat.lastMsgTime, chat.id, privateKey, currentUserId, chat.lastMsgObj]);

  // --- LOADER RETURN ---
  if (isDecrypting) {
    return (
      <span className="sidebar-loader-container">
        <span className="dot-loader"></span>
        <span className="dot-loader"></span>
        <span className="dot-loader"></span>
      </span>
    );
  }

  return <span className="msg-text-part">{displayText}</span>;
};

const SideBar = ({ chats = [], activeChatId, onChatSelect, isLoading }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);
  const myPrivateKey = currentUser?.privateKey || currentUser?.user?.privateKey;

  const SidebarSkeleton = () => (
    <div className="sidebar-skeleton-list">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-name"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const formatSidebarTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffInDays === 0 && date.getDate() === now.getDate()) return timeStr;
    if (
      diffInDays === 1 ||
      (diffInDays === 0 && date.getDate() !== now.getDate())
    )
      return "Yesterday";
    if (diffInDays < 7)
      return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffInDays === 0 && date.getDate() === now.getDate()) {
      return `last seen today at ${timeStr}`;
    }
    if (
      diffInDays === 1 ||
      (diffInDays === 0 && date.getDate() !== now.getDate())
    ) {
      return `last seen yesterday at ${timeStr}`;
    }
    if (diffInDays < 7) {
      return `last seen ${date.toLocaleDateString([], { weekday: "short" })} at ${timeStr}`;
    }
    return `last seen ${date.toLocaleDateString([], { day: "2-digit", month: "2-digit" })}`;
  };

  const EmptyState = () => (
    <div className="empty-state-container">
      <CiChat1 className="empty-state-icon" />
      <h3>No Conversations</h3>
      <p>Search for a user to start a new chat!</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="sidebar-container-loader">
        <div className="sidebar-header">
          <img src={logo} alt="App Logo" className="logo-img" />
          <h1>
            Hyloosec
          </h1>
        </div>
        <SidebarSkeleton />
      </div>
    );
  }

  // 2. Agar loading khatam ho gayi aur koi chat nahi mili
  if (!chats || chats.length === 0) {
    return (
      <>
        <div className="sidebar-header">
          <img src={logo} alt="App Logo" className="logo-img" />
          <h1>
            Hyloosec
          </h1>
        </div>
        <div className="search-bar" onClick={() => setIsSearchOpen(true)}>
          <CiSearch className="search-icon" />
          <input type="text" placeholder="Search by User ID..." readOnly />
        </div>
        <EmptyState />
        {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="sidebar-header">
        <img src={logo} alt="App Logo" className="logo-img" />
        <h1>
         Hyloosec
        </h1>
      </div>
      <div
        className="search-bar"
        onClick={() => setIsSearchOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <CiSearch className="search-icon" />
        <input type="text" placeholder="Search by User ID..." readOnly />
      </div>

      <div className="chat-list">
        {isLoading ? (
          <SidebarSkeleton />
        ) : chats.length > 0 ? (
          chats.map((chat) => {
            const imageSrc = chat.avatar || chat.profilePic;
            const lastMsgObj =
              chat.messages && chat.messages.length > 0
                ? chat.messages[chat.messages.length - 1]
                : null;

            const effectiveLastMsg =
              chat.lastMsgObj ||
              (chat.messages && chat.messages.length > 0
                ? chat.messages[chat.messages.length - 1]
                : null);

            const displayStatus = chat.lastMessageStatus;
            const isSentByMe = lastMsgObj
              ? String(lastMsgObj.senderId) === String(currentUser?.userId)
              : chat.lastMessageSenderId === String(currentUser?.userId);

            const isActuallyUnread = (chat.unreadCount || 0) > 0;

            return (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === activeChatId ? "active" : ""} ${isActuallyUnread ? "unread-chat" : ""}`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="sidebar-avatar-wrapper">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={chat.name}
                      className="sidebar-avatar-img"
                    />
                  ) : (
                    <div className="sidebar-icon-fallback">
                      <CiUser />
                    </div>
                  )}
                  <div
                    className={`status-dot ${chat.online ? "online" : "offline"}`}
                  ></div>
                </div>

                <div className="chat-info">
                  <div className="chat-info-header">
                    <h4 className={isActuallyUnread ? "unread-name-bold" : ""}>
                      {chat.name || chat.username || "Unknown User"}
                    </h4>

                    {chat.online ? (
                      <span className="online-indicator-text">online</span>
                    ) : chat.lastSeen ? ( // Use a clean ternary here
                      <span className="last-seen-sidebar-text">
                        {formatLastSeen(chat.lastSeen)}
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={`sidebar-last-msg ${isActuallyUnread ? "unread-msg-bold" : ""}`}
                  >
                    {isSentByMe && (
                      <span className="sidebar-tick">
                        {displayStatus === "seen" ? (
                          <PiSealCheckFill
                            size={16}
                            style={{ color: "#0051ff", marginRight: "4px" }} // Blue Tick
                          />
                        ) : displayStatus === "delivered" ? (
                          <PiSealCheckFill
                            size={16}
                            style={{ color: "#ffffff", marginRight: "4px" }} // White filled (Delivered)
                          />
                        ) : (
                          <PiSealCheckLight
                            size={16}
                            style={{ color: "#ffffff", marginRight: "4px" }} // Hollow (Sent/Sending)
                          />
                        )}
                      </span>
                    )}
                    <SidebarMsgPreview
                      chat={{ ...chat, lastMsgObj: effectiveLastMsg }} // This ensures data reaches the component
                      currentUserId={currentUser?.userId}
                      privateKey={myPrivateKey}
                    />
                    <span
                      className={`last-msg-time ${isActuallyUnread ? "unread-time-green" : ""}`}
                    >
                      {formatSidebarTime(chat.lastMsgTime)}
                    </span>
                  </p>
                </div>
                {isActuallyUnread && (
                  <span className="unread-badge-count">
                    {chat.unreadCount || 1}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState />
        )}
      </div>
      {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default SideBar;
