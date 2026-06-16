import React, { useEffect } from "react"; // 1. useEffect यहाँ से इंपोर्ट करें
import { useSelector, useDispatch } from "react-redux"; // 2. useDispatch इंपोर्ट करें
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

  // Auth.jsx के अंदर
  useEffect(() => {
  if (window.location.pathname === "/about" && view !== "about") {
    dispatch(setView("about"));
  }
}, [dispatch, view]);

const goToAbout = () => {
  window.history.pushState({}, "", "/about"); 
  dispatch(setView("about"));
};

  return (
    <div className={view === "about" ? "about-full-page" : "auth-full-page"}>
      {/* यहाँ केवल cardClass का उपयोग करें */}
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
