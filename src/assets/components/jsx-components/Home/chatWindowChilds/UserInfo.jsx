import { useState, useEffect } from "react";
import "./UserInfo.css";
import axios from "axios";
import { CiUser } from "react-icons/ci";
import { useSelector } from "react-redux";

const UserInfo = ({ activeChat, onClose }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const [otherUserBio, setOtherUserBio] = useState(null);

  const isMe = currentUser?.userId === (activeChat?.userId || activeChat?.id);

  useEffect(() => {
  const targetUserId = activeChat?.userId || activeChat?.id;

  if (!targetUserId || isMe) return;

  const fetchBio = async () => {
    try {
      const response = await axios.get(
        `https://hyloosec-spring-backend.onrender.com/api/user/profile/${targetUserId}`
      );

      setOtherUserBio(response.data?.bio ?? null);
    } catch (err) {
      console.error("Failed to fetch user bio:", err);
    }
  };

  fetchBio();
}, [activeChat, isMe]);


  const userBio = isMe
    ? currentUser?.bio || "Hey there! I am using Hyloosec."
    : otherUserBio || activeChat?.bio || "Hey there! I am using Hyloosec.";

    console.log(activeChat);

  const displayPic = isMe
    ? currentUser?.profilePic
    : activeChat?.avatar || activeChat?.profilePic;

  return (
    <div className="user-profile-view">
      <div className="profile-actions">
        <button className="close-profile" onClick={onClose}>
          <i className="ph ph-x"></i>
        </button>
      </div>

      <div className="profile-details">
        <div className="profile-img-container">
          {displayPic ? (
            <img
              src={displayPic}
              alt={activeChat.name}
              className="profile-main-img"
            />
          ) : (
            <div className="profile-main-img-fallback">
              <CiUser size={100} />
            </div>
          )}
        </div>

        <div className="profile-text">
          <h2>
            {isMe
              ? currentUser?.username
              : activeChat?.name || activeChat?.username}
          </h2>
          <p className="profile-status">{userBio}</p>
          {(activeChat?.userId || activeChat?.id) && (
            <p className="profile-user-id">
              ID: {activeChat.userId || activeChat.id}
            </p>
          )}
        </div>

        <div className="profile-info-grid">
          <div className="info-item">
            <label>Media, Links and Docs</label>
            <i className="ph ph-caret-right"></i>
          </div>
          <div className="info-item">
            <label>Mute Notifications</label>
            <i className="ph ph-bell-slash"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
