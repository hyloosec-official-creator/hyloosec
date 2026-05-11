import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./App.css";
import Loader from "./assets/components/jsx-components/Loader.jsx";
import Home from "./assets/components/jsx-components/Home.jsx";
import SideNav from "./assets/components/jsx-components/SideNav.jsx";
import Settings from "./assets/components/jsx-components/Settings.jsx";
import Auth from "./Auth/Auth.jsx";

const App = () => {
  const { user } = useSelector((state) => state.auth);
  const { activeChatId } = useSelector(
    (state) => state.chat || { activeChatId: null },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const [isDarkMode, setIsDarkMode] = useState(true);
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
  }, [isDarkMode]);

  // 2. Move the loading/user effect UP
  useEffect(() => {
    if (user) {
      // Turant false karne ki bajaye, ek minimum delay set karein
      const timer = setTimeout(() => {
        setIsLoading(false);
        setActiveTab("chats");
      }, 2000); // 2000ms = 2 Seconds (Aap isko adjust kar sakte hain)

      return () => clearTimeout(timer); // Cleanup timer if component unmounts
    }
  }, [user]);

  // 3. ONLY AFTER ALL HOOKS are declared, you can do conditional returns
  if (!user) {
    return <Auth />;
  }

  if (isLoading) {
    return <Loader finishLoading={() => setIsLoading(false)} />;
  }

  return (
    <div className="App">
      {isLoading ? (
        <Loader finishLoading={() => setIsLoading(false)} />
      ) : (
        <div className="app-container">
          {!shouldHideNav && (
            <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {activeTab === "chats" ? (
            <Home />
          ) : (
            <Settings
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
