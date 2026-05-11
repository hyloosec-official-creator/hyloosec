import React from "react";
import { useSelector } from "react-redux";
import Login from "./components/Login";
import Create from "./components/Create";
import Forgot from "./components/Forgot";
import SuccessInfo from "./components/SuccessInfo";
import "./Auth.css";

const Auth = () => {
  const { view } = useSelector((state) => state.auth);

  return (
    <div className="auth-full-page">
      <div className={`auth-card ${view}-view-active`}>
        <div className="form-wrapper">
          {view === "login" && <Login />}
          {view === "forgot" && <Forgot />}
          {view === "register" && <Create />}
          {view === "success" && <SuccessInfo />}
        </div>
      </div>
    </div>
  );
};

export default Auth;