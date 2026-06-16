import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, loginUser } from "../../../Slice/authSlice";
import { CiUser, CiEdit, CiSaveUp2 } from "react-icons/ci";
import { JavaAPI } from "../../../api/api";
import socket from "../../../socket";
import axios from "axios";
import "../../css/Settings.css";

const Settings = ({ isDarkMode, setIsDarkMode }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [modal, setModal] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || "");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setNewBio(user?.bio || "");
  }, [user?.bio]);

  const showPopup = (msg, type = "success") => {
    setModal({ isVisible: true, message: msg, type });
  };

  const handleAvatarClick = () => {
    setShowAvatarOptions(!showAvatarOptions);
  };

  const handleViewImage = () => {
    setIsPreviewOpen(true);
    setShowAvatarOptions(false);
  };

  const handleUpdateClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
    setShowAvatarOptions(false);
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previousUser = { ...user };
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.userId);

    try {
      setUploading(true);
      // Settings.jsx line 57 ko change karke axios use karein
      const response = await JavaAPI.post(`/user/upload-profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Multipart bhej rahe hain isliye ye zaroori hai
        },
      });
      dispatch(loginUser({ ...user, profilePic: response.data.imageUrl }));
      showPopup("Profile picture updated successfully!");
    } catch (err) {
      dispatch(loginUser(previousUser));
      showPopup("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleBioUpdate = async () => {
    const previousBio = user.bio;
    try {
      await JavaAPI.post(`/user/update-bio`, {
        userId: user.userId,
        bio: newBio,
      });
      dispatch(loginUser({ ...user, bio: newBio }));
      setIsEditingBio(false);
      showPopup("Bio updated successfully!");
    } catch (err) {
      setNewBio(previousBio);
      dispatch(loginUser({ ...user, bio: previousBio }));
      showPopup("Failed to update bio.", "error");
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    dispatch(logout());
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  };

  return (
    <div className={`settings-container ${isDarkMode ? "dark" : ""}`}>
      {isPreviewOpen && (
        <div
          className="fullscreen-overlay"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Full Preview" />
            ) : (
              <CiUser size={200} color="white" />
            )}
            <button
              className="close-preview"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modal.isVisible && (
        <div className="modal-overlay">
          <div className={`modal-box ${modal.type}`}>
            <p>{modal.message}</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModal({ ...modal, isVisible: false });
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      <div className="setting-section">
        <h3>Profile</h3>
        <div className="profile-card">
          <div className="avatar-wrapper">
            <div className="avatar-main" onClick={handleAvatarClick}>
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="large-avatar"
                />
              ) : (
                <div className="large-avatar-icon">
                  <CiUser size={45} />
                </div>
              )}
              {uploading && <div className="avatar-loader">...</div>}
              <div className="avatar-edit-badge">
                <CiEdit size={16} />
              </div>
            </div>

            {showAvatarOptions && (
              <>
                <div
                  className="menu-backdrop"
                  onClick={() => setShowAvatarOptions(false)}
                />
                <div className="avatar-action-menu">
                  <button onClick={handleViewImage}>View Image</button>
                  <button onClick={handleUpdateClick}>Update Image</button>
                </div>
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleProfilePicUpload}
            />
          </div>

          <div className="profile-info">
            <h4>{user?.username || "xyz"}</h4>
            <p className="user-id">@{user?.userId || "0108245328"}</p>

            <div className="bio-row">
              {isEditingBio ? (
                <>
                  <textarea
                    className="bio-input bio-textarea"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    autoFocus
                  />
                  <CiSaveUp2
                    className="bio-icon-btn save"
                    onClick={handleBioUpdate}
                  />
                </>
              ) : (
                <>
                  <span className="bio-text">{user?.bio || "No bio set"}</span>
                  <CiEdit
                    className="bio-icon-btn"
                    onClick={() => setIsEditingBio(true)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="setting-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <div className="theme-toggle-row">
            <p>Dark Mode</p>
            <button
              className={`theme-toggle-btn ${isDarkMode ? "active" : ""}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div className="toggle-thumb"></div>
            </button>
          </div>
        </div>
      </section>

      <div className="setting-section">
        <h3>Account</h3>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
