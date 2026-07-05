import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSessionExpired } from "./Slice/authSlice.js";
import "./App.css";
import Loader from "./assets/components/jsx-components/Loader.jsx";
import Home from "./assets/components/jsx-components/Home.jsx";
import SideNav from "./assets/components/jsx-components/SideNav.jsx";
import Settings from "./assets/components/jsx-components/Settings.jsx";
import Auth from "./Auth/Auth.jsx";
import About from "./Auth/components/About.jsx";

const App = () => {
  const { user, isSessionExpired } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { activeChatId } = useSelector(
    (state) => state.chat || { activeChatId: null },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("isDarkMode");
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldHideNav = isMobile && activeChatId !== null;

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark-theme");
    } else {
      root.classList.remove("dark-theme");
    }
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // 2. Move the loading/user effect UP
  useEffect(() => {
    if (user) {
      // Turant false karne ki bajaye, ek minimum delay set karein
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // 2000ms = 2 Seconds (Aap isko adjust kar sakte hain)

      return () => clearTimeout(timer); // Cleanup timer if component unmounts
    }
  }, []);

  useEffect(() => {
    console.log("Current activeTab is:", activeTab);
  }, [activeTab]);

  if (window.location.pathname === "/about") {
    return <About />;
  }

  if (!user) {
    return <Auth />;
  }

  if (isLoading) {
    return <Loader finishLoading={() => setIsLoading(false)} />;
  }

  return (
    <div className="App">
      {isSessionExpired && (
        <div className="session-popup-overlay">
          <div className="session-popup">
            <div className="popup-icon-container">
              <span className="lock-icon">🔒</span>
            </div>

            <h3>Security Alert</h3>

            <div className="message-container">
              <p>Your session has expired.</p>
              <p className="sub-text">
                For security reasons, we only provide a{" "}
                <strong>7-day login session</strong>. Please log in again to
                continue enjoying secure conversations.
              </p>
            </div>
            <button
              onClick={() => {
                dispatch(setSessionExpired(false));
                localStorage.clear();
                window.location.reload();
              }}
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader finishLoading={() => setIsLoading(false)} />
      ) : (
        <div className="app-container">
          {!shouldHideNav && (
            <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* CSS के ज़रिए हाइड/शो करें (Display Property) */}
          <div
            style={{
              display: activeTab === "chats" ? "flex" : "none",
              width: "100%",
            }}
          >
            <Home />
          </div>

          <div
            style={{
              display: activeTab === "settings" ? "flex" : "none",
              width: "100%",
            }}
          >
            <Settings
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
