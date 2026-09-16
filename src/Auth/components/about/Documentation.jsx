import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setView } from "../../../Slice/authSlice";
import "./Documentation.css";

import CreateDocumentation from "./DocumentationChilds/CreateDocumentation";
import LoginDocumentation from "./DocumentationChilds/LoginDocumentation";
import ForgotPasswordDocumentation from "./DocumentationChilds/ForgotPasswordDocumentation";
import FindUserDocumentation from "./DocumentationChilds/FindUserDocumentation";
import MainChatDocumentation from "./DocumentationChilds/MainChatDocumentation";
import SettingDocumentation from "./DocumentationChilds/SettingDocumentation";

const Documentation = () => {
  const [activePage, setActivePage] = useState(null);
  const dispatch = useDispatch();

  if (activePage === "create") {
    return (
      <CreateDocumentation
        onHome={() => setActivePage(null)}
      />
    );
  }

  if (activePage === "login") {
    return (
      <LoginDocumentation
        onHome={() => setActivePage(null)}
      />
    );
  }

  if (activePage === "forgot-password") {
    return (
      <ForgotPasswordDocumentation
        onHome={() => setActivePage(null)}
      />
    );
  }

  if (activePage === "find-user") {
    return (
      <FindUserDocumentation
        onHome={() => setActivePage(null)}
      />
    );
  }

  if (activePage === "main-chat") {
    return (
      <MainChatDocumentation
        onHome={() => setActivePage(null)}
      />
    );
  }

  if (activePage === "settings") {
    return (
      <SettingDocumentation
        onHome={() => setActivePage(null)}
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
          onClick={() => setActivePage("create")}
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
          onClick={() => setActivePage("login")}
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
          onClick={() => setActivePage("forgot-password")}
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
          onClick={() => setActivePage("find-user")}
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
          onClick={() => setActivePage("main-chat")}
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
          onClick={() => setActivePage("settings")}
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