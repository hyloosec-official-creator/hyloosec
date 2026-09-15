import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import logo from "../../../images/logo/logo.png";
import { CiSearch, CiUser, CiChat1 } from "react-icons/ci";
import { PiSealCheckLight, PiSealCheckFill } from "react-icons/pi";
import "./SideBar.css";
import { decryptText } from "../../../../utils/cryptoUtils";

// ============================================================
// SIDEBAR MESSAGE PREVIEW
// ============================================================

const SidebarMsgPreview = ({ chat, currentUserId, privateKey }) => {
  const [displayText, setDisplayText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getPreview = async () => {
      const msg = chat.lastMsgObj;

      // --------------------------------------------------------
      // 1. MEDIA MESSAGE
      // --------------------------------------------------------

      let messageType = chat.lastMessageType;

      // Fallback for old messages which don't have lastMessageType
      if (!messageType && msg?.files?.length > 0) {
        const mime = msg.files[0]?.type || "";

        if (mime.startsWith("image/")) {
          messageType = "i";
        } else if (mime.startsWith("video/")) {
          messageType = "v";
        } else if (mime.startsWith("audio/")) {
          messageType = "a";
        } else {
          messageType = "d";
        }
      }

      const mediaPreview = {
        i: "🖼️ Image",
        v: "🎥 Video",
        a: "🎵 Audio",
        d: "📄 Document",
      };

      // Media gets priority over text
      if (messageType && messageType !== "t") {
        if (isMounted) {
          setDisplayText(mediaPreview[messageType] || "📎 Attachment");
          setIsDecrypting(false);
        }

        return;
      }

      // --------------------------------------------------------
      // 2. ENCRYPTED TEXT MESSAGE
      // --------------------------------------------------------

      if (msg && (msg.textForSender || msg.textForReceiver)) {
        if (isMounted) {
          setIsDecrypting(true);
        }

        try {
          const isMe = String(msg.senderId) === String(currentUserId);

          const encryptedText = isMe ? msg.textForSender : msg.textForReceiver;

          if (encryptedText && privateKey) {
            const decrypted = await decryptText(encryptedText, privateKey);

            if (isMounted && decrypted) {
              setDisplayText(
                decrypted.length > 15
                  ? decrypted.substring(0, 15) + "..."
                  : decrypted,
              );

              setIsDecrypting(false);
              return;
            }
          }

          // Private key not available yet
          if (encryptedText && !privateKey) {
            return;
          }
        } catch (err) {
          console.error("Sidebar message decryption failed:", err);
        }
      }

      // --------------------------------------------------------
      // 3. OLD ATTACHMENT FALLBACK
      // --------------------------------------------------------

      if (chat.lastMsg === "📎 Attachment") {
        if (isMounted) {
          setDisplayText("📎 Attachment");
          setIsDecrypting(false);
        }

        return;
      }

      // --------------------------------------------------------
      // 4. OLD / STATIC TEXT MESSAGE
      // --------------------------------------------------------

      if (chat.lastMsg && chat.lastMsg.length < 50) {
        if (isMounted) {
          setDisplayText(chat.lastMsg);
        }
      } else {
        if (isMounted) {
          setDisplayText("No messages yet");
        }
      }

      if (isMounted) {
        setIsDecrypting(false);
      }
    };

    getPreview();

    return () => {
      isMounted = false;
    };
  }, [
    chat.lastMsgTime,
    chat.id,
    chat.lastMsg,
    chat.lastMsgObj,
    chat.lastMessageType,
    privateKey,
    currentUserId,
  ]);

  // ----------------------------------------------------------
  // LOADER
  // ----------------------------------------------------------

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

// ============================================================
// SIDEBAR
// ============================================================

const SideBar = ({
  chats = [],
  activeChatId,
  onChatSelect,
  isLoading,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useSelector((state) => state.auth.user);

  const myPrivateKey = currentUser?.privateKey || currentUser?.user?.privateKey;

  // ==========================================================
  // PROCESS CHATS
  // ==========================================================

  const processedChats = useMemo(() => {
    const processed = chats.map((chat) => {
      const lastMessageFromHistory =
        chat.messages?.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null;

      // DB lastMsgObj gets priority
      const effectiveLastMsg =
        chat.lastMsgObj || lastMessageFromHistory || null;

      const isSentByMe = effectiveLastMsg
        ? String(effectiveLastMsg.senderId) === String(currentUser?.userId)
        : false;

      return {
        ...chat,

        effectiveLastMsg,

        isSentByMe,

        isActuallyUnread: Number(chat.unreadCount || 0) > 0,
      };
    });

    // ==========================================================
    // SORT BY LAST MESSAGE TIME
    // Latest message -> TOP
    // ==========================================================

    return processed.sort((a, b) => {
      const timeA = a.lastMsgTime ? new Date(a.lastMsgTime).getTime() : 0;

      const timeB = b.lastMsgTime ? new Date(b.lastMsgTime).getTime() : 0;

      return timeB - timeA;
    });
  }, [chats, currentUser?.userId]);

  // ==========================================================
  // SIDEBAR SEARCH
  // ==========================================================

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Empty search -> show all sidebar chats
    if (!query) {
      return processedChats;
    }

    // Search ONLY inside existing sidebar chats
    return processedChats.filter((chat) => {
      const name = String(chat.name || "").toLowerCase();

      const username = String(chat.username || "").toLowerCase();

      const userId = String(chat.userId || chat.id || "").toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        userId.includes(query)
      );
    });
  }, [processedChats, searchQuery]);

  // ==========================================================
  // SKELETON
  // ==========================================================

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

  // ==========================================================
  // TIME FORMAT
  // ==========================================================

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

    if (diffInDays === 0 && date.getDate() === now.getDate()) {
      return timeStr;
    }

    if (
      diffInDays === 1 ||
      (diffInDays === 0 && date.getDate() !== now.getDate())
    ) {
      return "Yesterday";
    }

    if (diffInDays < 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
      });
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // ==========================================================
  // LAST SEEN FORMAT
  // ==========================================================

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
      return `last seen ${date.toLocaleDateString([], {
        weekday: "short",
      })} at ${timeStr}`;
    }

    return `last seen ${date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
    })}`;
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

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
        {/* HEADER */}
        <div className="sidebar-header">
          <img src={logo} alt="App Logo" className="logo-img" />

          <h1
            className={`app-title-header ${
              isDarkMode ? "dark-text" : "light-text"
            }`}
          >
            HylooSec
          </h1>
        </div>

        {/* SEARCH BAR - ALWAYS VISIBLE */}
        <div className="search-bar loading-search-bar">
          <CiSearch className="search-icon" />

          <input
            type="text"
            placeholder="Search by name or User ID..."
            disabled
          />
        </div>

        {/* CHAT LOADER */}
        <SidebarSkeleton />
      </div>
    );
  }
  return (
    <>
      {/* ------------------------------------------------------
          HEADER
      ------------------------------------------------------ */}

      <div className="sidebar-header">
        <img src={logo} alt="App Logo" className="logo-img" />

        <h1
          className={`app-title-header ${
            isDarkMode ? "dark-text" : "light-text"
          }`}
        >
          HylooSec
        </h1>
      </div>

      {/* ------------------------------------------------------
          SEARCH
      ------------------------------------------------------ */}

      <div className="search-bar">
        <CiSearch className="search-icon" />

        <input
          type="text"
          placeholder="Search by name or User ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ------------------------------------------------------
          CHAT LIST
      ------------------------------------------------------ */}

      <div className="chat-list">
        {/* No chats at all */}
        {chats.length === 0 ? (
          <EmptyState />
        ) : filteredChats.length > 0 ? (
          /* Search results / normal sidebar */
          filteredChats.map((chat) => {
            const imageSrc = chat.avatar || chat.profilePic || "";

            const displayStatus = chat.lastMessageStatus;

            return (
              <div
                key={chat.id}
                className={`
                  chat-item
                  ${String(chat.id) === String(activeChatId) ? "active" : ""}
                  ${chat.isActuallyUnread ? "unread-chat" : ""}
                `}
                onClick={() => onChatSelect(chat.id)}
              >
                {/* ------------------------------------------------
                    AVATAR
                ------------------------------------------------ */}

                <div className="sidebar-avatar-wrapper">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={chat.name || chat.username || "User"}
                      className="sidebar-avatar-img"
                    />
                  ) : (
                    <div className="sidebar-icon-fallback">
                      <CiUser />
                    </div>
                  )}

                  <div
                    className={`
                      status-dot
                      ${chat.online ? "online" : "offline"}
                    `}
                  />
                </div>

                {/* ------------------------------------------------
                    CHAT INFO
                ------------------------------------------------ */}

                <div className="chat-info">
                  {/* NAME + ONLINE / LAST SEEN */}

                  <div className="chat-info-header">
                    <h4
                      className={
                        chat.isActuallyUnread ? "unread-name-bold" : ""
                      }
                    >
                      {chat.name || chat.username || `User ${chat.id}`}
                    </h4>

                    {chat.online ? (
                      <span className="online-indicator-text">online</span>
                    ) : chat.lastSeen ? (
                      <span className="last-seen-sidebar-text">
                        {formatLastSeen(chat.lastSeen)}
                      </span>
                    ) : null}
                  </div>

                  {/* ------------------------------------------------
                      LAST MESSAGE
                  ------------------------------------------------ */}

                  <p
                    className={`
                      sidebar-last-msg
                      ${chat.isActuallyUnread ? "unread-msg-bold" : ""}
                    `}
                  >
                    {/* SENT MESSAGE TICK */}

                    {chat.isSentByMe && (
                      <span className="sidebar-tick">
                        {displayStatus === "seen" ? (
                          <PiSealCheckFill
                            size={16}
                            style={{
                              color: "#0051ff",
                              marginRight: "4px",
                            }}
                          />
                        ) : displayStatus === "delivered" ? (
                          <PiSealCheckFill
                            size={16}
                            style={{
                              color: "#ffffff",
                              marginRight: "4px",
                            }}
                          />
                        ) : (
                          <PiSealCheckLight
                            size={16}
                            style={{
                              color: "#ffffff",
                              marginRight: "4px",
                            }}
                          />
                        )}
                      </span>
                    )}

                    {/* MESSAGE PREVIEW */}

                    <SidebarMsgPreview
                      chat={{
                        ...chat,
                        lastMsgObj: chat.effectiveLastMsg,
                      }}
                      currentUserId={currentUser?.userId}
                      privateKey={myPrivateKey}
                    />

                    {/* TIME */}

                    <span
                      className={`
                        last-msg-time
                        ${chat.isActuallyUnread ? "unread-time-green" : ""}
                      `}
                    >
                      {formatSidebarTime(chat.lastMsgTime)}
                    </span>
                  </p>
                </div>

                {/* ------------------------------------------------
                    UNREAD COUNT
                ------------------------------------------------ */}

                {chat.isActuallyUnread && (
                  <span className="unread-badge-count">{chat.unreadCount}</span>
                )}
              </div>
            );
          })
        ) : (
          /* Search result not found */

          <div className="empty-state-container">
            <CiSearch className="empty-state-icon" />

            <h3>No User Found</h3>

            <p>No sidebar user matches "{searchQuery}"</p>
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(SideBar);
