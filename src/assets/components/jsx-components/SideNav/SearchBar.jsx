import React, { useState } from "react";
import { CiSearch, CiCircleRemove, CiUser } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux"; // Added useSelector here
import { openOrAddChat } from "../../../../store/slices/chatSlice";
import "./SearchBar.css";

const SearchBar = ({ onClose }) => {
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Now this will work properly
  const currentUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const handleSearch = async () => {
    if (searchId.length !== 10) return;

    setLoading(true);
    setError(false);
    setFoundUser(null);

    try {
      const response = await fetch(`https://HylooSec-spring-backend.onrender.com/api/user/${searchId}`);
      
      if (!response.ok) throw new Error("User not found");
      
      const data = await response.json();
      setFoundUser(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

// SearchBar.jsx
const handleMessageClick = async () => {
  if (!foundUser || !currentUser) return;
  
  try {
    // 1. Create/Register the conversation in MongoDB immediately
    // We call an endpoint to ensure the conversation document exists
    await fetch(`https://HylooSec-node-backend.onrender.com/api/conversations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: currentUser.userId,
        receiverId: foundUser.userId,
        lastMessage: "Started a new conversation" 
      }),
    });

    // 2. Fetch history (your existing logic)
    const response = await fetch(`https://HylooSec-node-backend.onrender.com/api/messages/${currentUser.userId}/${foundUser.userId}`);
    const history = await response.json();
    
    // 3. Update Redux (Your existing logic)
    dispatch(openOrAddChat({
      ...foundUser,
      id: foundUser.userId, // Ensure ID mapping matches your sidebar expectation
      messages: history 
    }));

    onClose();
  } catch (err) {
    console.error("Error starting conversation:", err);
    dispatch(openOrAddChat({ ...foundUser, id: foundUser.userId }));
    onClose();
  }
};

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <CiCircleRemove size={28} />
        </button>

        <div className="search-header">
          <h3>Find User</h3>
          <p>Search by unique 10-digit User ID</p>
        </div>

        <div className="search-input-group">
          <input
            type="text"
            placeholder="Enter User Id..."
            value={searchId}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value;
              // Ensures only numeric input
              if (/^\d*$/.test(val)) setSearchId(val); 
            }}
            onKeyDown={(e) => e.key === "Enter" && searchId.length === 10 && handleSearch()}
          />
          <button
            className="primary-search-btn"
            onClick={handleSearch}
            disabled={searchId.length !== 10 || loading}
            style={{ opacity: searchId.length === 10 ? 1 : 0.5 }}
          >
            {loading ? <div className="loader-spinner"></div> : <CiSearch size={22} />}
          </button>
        </div>

        <div className="search-content">
          {foundUser && (
            <div className="search-result-card animate-in">
              <div className="result-avatar">
                {foundUser.profilePic ? (
                  <img src={foundUser.profilePic} alt="user" />
                ) : (
                  <div className="user-avatar-placeholder">
                     <CiUser size={30} />
                  </div>
                )}
              </div>
              <div className="result-info">
                <h4>{foundUser.username}</h4>
                <span>{foundUser.bio || "No bio available"}</span>
              </div>
              <button className="message-btn" onClick={handleMessageClick}>
                Message
              </button>
            </div>
          )}

          {error && (
            <p className="search-status-text error">
              User not found. Check the ID and try again.
            </p>
          )}
          {!foundUser && !error && !loading && (
            <p className="search-status-text">Enter ID to start searching</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;