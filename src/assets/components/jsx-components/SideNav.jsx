import { useState } from "react";
import { useSelector } from "react-redux";
import { CiUser, CiCirclePlus } from "react-icons/ci";
import SearchBar from "./SideNav/SearchBar";

const SideNav = ({ activeTab, setActiveTab }) => {
  const user = useSelector((state) => state.auth.user);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="side-nav">
        <div className="side-nav-top">
          <div className="padding"></div>
          <div className="nav-item" onClick={() => setActiveTab("chats")}>
            <i
              className={`ph ph-chats ${activeTab === "chats" ? "active" : ""} `}
            ></i>
            <span className="tooltip">Chats</span>
          </div>

          <div
            className="nav-item search-btn"
            onClick={() => setIsSearchOpen(true)}
          >
            <CiCirclePlus size={28} color="var(--primary-green)" />
            <span className="tooltip">Add User</span>
          </div>
        </div>

        <div className="side-nav-bottom">
          <div className="nav-item" onClick={() => setActiveTab("settings")}>
            <i
              className={`ph ph-gear ${activeTab === "settings" ? "active" : ""} setting-icon`}
            ></i>
            <span className="tooltip">Setting</span>
          </div>
          {user?.profilePic || user?.avatar ? (
            <img
              src={user.profilePic || user.avatar}
              alt="Profile"
              className="user-avatar"
              onError={(e) => {
                console.log("Image failed to load");
                e.target.style.display = "none"; // Fallback to icon if link is broken
              }}
            />
          ) : (
            <div className="user-avatar">
              <CiUser size={30} />
            </div>
          )}
        </div>
      </nav>
      {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default SideNav;
