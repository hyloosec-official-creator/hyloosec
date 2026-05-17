import React, { useState, useEffect } from "react";
import "../../css/Loader.css";
import logo from "../../images/logo/logo.png";

const Loader = ({ finishLoading }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(finishLoading, 500); // small delay for smoothness
          return 100;
        }
        return prev + 2; //adjust speed here
      });
    }, 30); //Interval speed

    return () => clearInterval(interval);
  }, [finishLoading]);

  return (
    <div className="loader-container">
      <div className="loader-content">
        <img src={logo} alt="Logo" className="loader-logo" />
        <div className="progress-wrapper">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <h4 className="placeholder-subtitle">Chats are end-to-end encrypted</h4>
      </div>
    </div>
  );
};

export default Loader;
