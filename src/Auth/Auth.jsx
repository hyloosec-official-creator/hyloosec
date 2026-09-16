import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setView } from "../Slice/authSlice";

import Login from "./components/Login";
import Create from "./components/Create";
import About from "./components/About";
import Forgot from "./components/Forgot";
import SuccessInfo from "./components/SuccessInfo";

import "./Auth.css";

const Auth = () => {
  const { view } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const cardClass =
    view === "about" ? "about-page-wrapper" : `auth-card ${view}-view-active`;

  useEffect(() => {
    if (window.location.pathname.startsWith("/about") && view !== "about") {
      dispatch(setView("about"));
    }
  }, [dispatch, view]);

  return (
    <div className={view === "about" ? "about-full-page" : "auth-full-page"}>
      <div className={cardClass}>
        <div className="form-wrapper">
          {view === "login" && <Login />}

          {view === "forgot" && <Forgot />}

          {view === "register" && <Create />}

          {view === "success" && <SuccessInfo />}

          {view === "about" && <About />}
        </div>
      </div>
    </div>
  );
};

export default Auth;
