import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setView } from "../../../Slice/authSlice";
import "./Documentation.css";

import CreateDocumentation from "./DocumentationChilds/CreateDocumentation";
import LoginDocumentation from "./DocumentationChilds/LoginDocumentation";
import ForgotPasswordDocumentation from "./DocumentationChilds/ForgotPasswordDocumentation";
import FindUserDocumentation from "./DocumentationChilds/FindUserDocumentation";
import MainChatDocumentation from "./DocumentationChilds/MainChatDocumentation";
import SettingDocumentation from "./DocumentationChilds/SettingDocumentation";

const getDocumentationPage = () => {
  const path = window.location.pathname;

  if (path === "/about") return "home";
  if (path === "/about/create-account") return "create";
  if (path === "/about/login") return "login";
  if (path === "/about/forgot-password") return "forgot-password";
  if (path === "/about/find-user") return "find-user";
  if (path === "/about/main-chat") return "main-chat";
  if (path === "/about/settings") return "settings";

  return "home";
};

const Documentation = () => {
  const [activePage, setActivePage] = useState(getDocumentationPage);
  const dispatch = useDispatch();

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getDocumentationPage());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateDocumentation = (path) => {
    window.history.pushState({}, "", path);
    setActivePage(getDocumentationPage());
  };

  if (activePage === "create") {
    return (
      <CreateDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  if (activePage === "login") {
    return (
      <LoginDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  if (activePage === "forgot-password") {
    return (
      <ForgotPasswordDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  if (activePage === "find-user") {
    return (
      <FindUserDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  if (activePage === "main-chat") {
    return (
      <MainChatDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  if (activePage === "settings") {
    return (
      <SettingDocumentation
        onHome={() => navigateDocumentation("/about")}
      />
    );
  }

  const goToLogin = () => {
    window.history.pushState({}, "", "/");
    dispatch(setView("login"));
  };

  return (
    <div className="documentation">

      {/* Header */}
      <div className="documentation-home-header">
        <div className="documentation-home-badge">
          HylooSec Documentation
        </div>

        <h1>How can we help you?</h1>

        <p>
          Learn how to use HylooSec, manage your account,
          and get the most out of your secure messaging experience.
        </p>
      </div>

      {/* Documentation Cards */}
      <div className="documentation-menu">

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/create-account")
          }
        >
          <div className="documentation-card-number">
            01
          </div>

          <div className="documentation-card-content">
            <h2>Create an Account</h2>

            <p>
              Learn how to create your HylooSec account
              and complete the registration process.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/login")
          }
        >
          <div className="documentation-card-number">
            02
          </div>

          <div className="documentation-card-content">
            <h2>Login to HylooSec</h2>

            <p>
              Learn how to securely log in and access
              your HylooSec account.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/forgot-password")
          }
        >
          <div className="documentation-card-number">
            03
          </div>

          <div className="documentation-card-content">
            <h2>Reset Your Password</h2>

            <p>
              Follow the steps to recover your account
              if you forget your password.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/find-user")
          }
        >
          <div className="documentation-card-number">
            04
          </div>

          <div className="documentation-card-content">
            <h2>Find a User</h2>

            <p>
              Learn how to search for users and start
              a secure conversation.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/main-chat")
          }
        >
          <div className="documentation-card-number">
            05
          </div>

          <div className="documentation-card-content">
            <h2>Use the Main Chat</h2>

            <p>
              Understand the main chat screen,
              conversations, and messaging features.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

        <button
          className="documentation-card"
          onClick={() =>
            navigateDocumentation("/about/settings")
          }
        >
          <div className="documentation-card-number">
            06
          </div>

          <div className="documentation-card-content">
            <h2>Settings</h2>

            <p>
              Learn about HylooSec settings and how
              to customize your experience.
            </p>
          </div>

          <div className="documentation-card-arrow">
            →
          </div>
        </button>

      </div>

      {/* Back to Login */}
      <div className="documentation-home-footer">
        <button
          className="documentation-back-login"
          onClick={goToLogin}
        >
          ← Back to Login
        </button>
      </div>

    </div>
  );
};

export default Documentation;