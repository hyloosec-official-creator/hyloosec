import React, { useState } from "react";
import { CiSearch, CiCircleRemove, CiUser } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux"; 
import { openOrAddChat } from "../../../../store/slices/chatSlice";
import { JavaAPI, MongoAPI } from "../../../../api/api"; // 🎯 बख्तरबंद API क्रेडेंशियल्स
import "./SearchBar.css";

const SearchBar = ({ onClose }) => {
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false); // 👈 स्टेट का नाम 'error' है
  
  const currentUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const handleSearch = async () => {
    if (searchId.length !== 10) return;

    setLoading(true);
    setError(false); // ✅ फिक्स: 'setErrors' को 'setError' किया
    setFoundUser(null);

    try {
      // ☕ जावा बैकएंड: अब यह कुकीज़ लेकर सीधे स्प्रिंग बूट के पास जाएगा
      const res = await JavaAPI.get(`/user/${searchId}`);
      console.log("Full Response from Java API:", res.data);
      // Axios में रिस्पॉन्स का डेटा सीधे .data में मिलता है
      setFoundUser(res.data);
    } catch (err) {
      console.error("Search Error:", err);
      setError(true); // ✅ फिक्स: 'setErrors' को 'setError' किया
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async () => {
    if (!foundUser || !currentUser) return;
    
    try {
      setLoading(true);

      // 🍃 1. मोंगो बैकएंड (Node.js): पुराने fetch को हटाकर सीधे बख्तरबंद MongoAPI लगाया
      await MongoAPI.post("/conversations/register", {
        senderId: String(currentUser.userId),
        receiverId: String(foundUser.userId),
        lastMessage: "Started a new conversation" 
      });

      // 🍃 2. मोंगो मैसेज हिस्ट्री: इसे भी MongoAPI पर शिफ्ट कर दिया ताकि कुकी ब्लॉक न हो
      const resHistory = await MongoAPI.get(`/messages/${currentUser.userId}/${foundUser.userId}`);
      const history = resHistory.data;
      
      // 3. रेडक्स स्टेट सिंक (Redux Update)
      dispatch(openOrAddChat({
        ...foundUser,
        id: foundUser.userId, 
        messages: history 
      }));

      onClose();
    } catch (err) {
      console.error("Error starting conversation:", err);
      // बैकअप लॉजिक अगर हिस्ट्री लोड न हो तब भी चैट बॉक्स खोल दो
      dispatch(openOrAddChat({ ...foundUser, id: foundUser.userId, messages: [] }));
      onClose();
    } finally {
      setLoading(false);
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
              <button className="message-btn" onClick={handleMessageClick} disabled={loading}>
                {loading ? "Starting..." : "Message"}
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