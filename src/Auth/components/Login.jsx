import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api/axios.js";
import { Eye, EyeOff } from "lucide-react";
import SecurityModal from "./LoginSecurityModal/SecurityModal.jsx";
import Logo from "../../assets/images/logo/logo.png";
import {
  setView,
  setAuthError,
  loginUser,
  clearMessages,
} from "../../Slice/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ userId: "", password: "" });

  const [showModal, setShowModal] = useState(false);
  const [tempData, setTempData] = useState(null);

  const handleChange = (e) => {
    if (error) dispatch(clearMessages());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt started with:", formData.userId); // LOG 1
    try {
      const response = await API.post("/api/auth/login", formData);
      console.log("Server Response:", response.data); // LOG 2
      if (response.status === 200) {
        console.log("Dispatching loginUser action...", response.data); // LOG 3
        setTempData(response.data);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Login Error Object:", err); // LOG 4
      if (err.response?.status === 423) {
        const responseData = err.response.data;
        const remainingMinutes = responseData.split(":")[1] || "15";

        dispatch(
          setAuthError(
            `Account locked. Please try again in ${remainingMinutes} minutes.`,
          ),
        );
      } else if (err.response?.status === 401) {
        dispatch(setAuthError("Invalid User Id or Password."));
      } else {
        dispatch(setAuthError("Server error. Please try again later."));
      }
      setFormData({ ...formData, password: "" });
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSecuritySuccess = (privateKey) => {
    // Redux mein user data aur decrypted private key bhej dein
    dispatch(loginUser({ ...tempData, privateKey }));
    setShowModal(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="login fade-in"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          // Height 100% ki jagah auto rakhein taaki card ke andar padding bani rahe
          height: "auto",
          margin: "0 auto",
        }}
      >
        <div className="logo-container" style={{ marginBottom: "10px" }}>
          <img 
            src={Logo} 
            alt="HylooSec Logo" 
            style={{ 
              width: "80px", // Size aap adjust kar sakte hain
              height: "auto",
              display: "block",
              margin: "0 auto"
            }} 
          />
        </div>
        <h2 className="Welcome" style={{ marginBottom: "20px" }}>
          Welcome Back
        </h2>

        {/* input-form ko width 100% dena zaroori hai */}
        <div className="input-form" style={{ width: "100%" }}>
          <input
            name="userId"
            type="text"
            placeholder="User Id"
            required
            value={formData.userId}
            onChange={handleChange}
            aria-label="User ID"
            style={{ width: "100%" }}
          />

          <div
            className="password-wrapper"
            style={{ position: "relative", width: "100%", marginTop: "10px" }}
          >
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              aria-label="Password"
              style={{ width: "100%", paddingRight: "45px" }}
            />
            <button
              type="button"
              className="eye-button"
              onClick={togglePasswordVisibility}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p
              className="error-message"
              role="alert"
              style={{ marginTop: "10px" }}
            >
              {error}
            </p>
          )}

          <div style={{ textAlign: "right", width: "100%", marginTop: "5px" }}>
            <span
              className="forgot-link"
              onClick={() => dispatch(setView("forgot"))}
              style={{ cursor: "pointer", fontSize: "0.85rem" }}
            >
              Forgot Password?
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="auth-btn"
          style={{ width: "100%", marginTop: "20px" }}
        >
          Login
        </button>

        <div className="center-toggle" style={{ marginTop: "15px" }}>
          <button
            type="button"
            onClick={() => dispatch(setView("register"))}
            className="toggle-btn"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            New to HylooSec? Create an account
          </button>
        </div>
      </form>

      {showModal && (
        <SecurityModal
          userData={tempData}
          onSuccess={handleSecuritySuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default Login;
