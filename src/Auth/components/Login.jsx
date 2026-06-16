import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { JavaAPI } from "../../api/api.js";
import { Eye, EyeOff } from "lucide-react";
import SecurityModal from "./LoginSecurityModal/SecurityModal.jsx";
import Logo from "../../assets/images/logo/logo.png";
import {
  setView,
  setAuthError,
  loginUser,
  clearMessages,
} from "../../Slice/authSlice";

const TermsModal = ({ onClose, onAccept }) => {
  return (
    <div className="modal-overlay" style={styles.overlay}>
      <div className="modal-content" style={styles.content}>
        <h2 style={{ color: "#6e54ff", marginBottom: "15px" }}>
          Terms of Service
        </h2>
        <div style={styles.scrollBox}>
          <p style={{ marginBottom: "15px" }}>
            <strong>Welcome to HylooSec!</strong> By accessing this platform,
            you agree to comply with these Terms of Service. If you do not
            agree, please discontinue use immediately.
          </p>

          <p style={{ marginBottom: "15px" }}>
            <strong className="legal-section-heading">
              1. Account Security:
            </strong>{" "}
            You are solely responsible for maintaining the confidentiality of
            your private keys and login credentials. Any unauthorized access
            resulting from your negligence is your sole responsibility.
          </p>

          <p style={{ marginBottom: "15px" }}>
            <strong className="legal-section-heading">
              2. Prohibited Conduct:
            </strong>{" "}
            Any unauthorized access attempts, reverse engineering of security
            protocols, or malicious activity directed at HylooSec will be
            blocked, logged, and reported to authorities.
          </p>

          <p style={{ marginBottom: "15px" }}>
            <strong className="legal-section-heading">
              3. Account Suspension:
            </strong>{" "}
            We reserve the absolute right to suspend or terminate accounts that
            violate our security standards or compromise the integrity of the
            platform.
          </p>

          <p style={{ marginBottom: "15px" }}>
            <strong className="legal-section-heading">
              4. Service Availability:
            </strong>{" "}
            HylooSec is provided "as-is". We do not guarantee uninterrupted
            access and are not liable for any service downtime or data loss
            occurring during maintenance or system upgrades.
          </p>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Close
          </button>
          <button onClick={onAccept} style={styles.acceptBtn}>
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles updated with better spacing
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "400px",
    maxWidth: "90%",
  },
  scrollBox: {
    maxHeight: "250px", // थोड़ी हाइट बढ़ाई है
    overflowY: "auto",
    margin: "15px 0",
    fontSize: "0.9rem",
    color: "#c5c3c3",
    paddingRight: "10px", // स्क्रोलबार के लिए जगह
  },
  buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "10px" },
  cancelBtn: {
    padding: "8px 15px",
    cursor: "pointer",
    background: "#ccc",
    border: "none",
    borderRadius: "5px",
  },
  acceptBtn: {
    padding: "8px 15px",
    cursor: "pointer",
    background: "#6e54ff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  },
};

const Login = () => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    acceptTerms: false,
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [isLoadingButton, setIsLoadingButton] = useState(false);

  const handleChange = (e) => {
    if (error) dispatch(clearMessages());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt started with:", formData.userId);

    if (!formData.acceptTerms) {
      dispatch(setAuthError("You must agree to the Terms & Conditions."));
      return;
    }

    // 2. ID और Password वैलिडेशन (जो हमने डिस्कस किया था)
    if (!/^\d{10}$/.test(formData.userId)) {
      dispatch(setAuthError("User ID must be exactly 10 digits."));
      return;
    }

    try {
      setIsLoadingButton(true);
      const response = await JavaAPI.post("/auth/login", {
        userId: formData.userId,
        password: formData.password,
        acceptTerms: formData.acceptTerms,
      });
      console.log("Server Response:", response.data);
      if (response.status === 200) {
        console.log("Dispatching loginUser action...", response.data);
        setTempData(response.data);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Login Error Object:", err);
      if (err.response?.status === 423) {
        const responseData = err.response.data;
        let remainingMinutes = "15";

        if (typeof responseData === "string" && responseData.includes(":")) {
          remainingMinutes = responseData.split(":")[1] || "15";
        } else if (responseData && responseData.minutes) {
          remainingMinutes = responseData.minutes; // Handling if backend sends object
        }

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
    } finally {
      setIsLoadingButton(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSecuritySuccess = (privateKey) => {
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
          height: "auto",
          margin: "0 auto",
        }}
      >
        <div className="logo-container" style={{ marginBottom: "10px" }}>
          <img
            src={Logo}
            alt="HylooSec Logo"
            style={{
              width: "80px",
              height: "auto",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>
        <h2 className="Welcome" style={{ marginBottom: "20px" }}>
          Welcome Back
        </h2>

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

        <div
          style={{
            marginTop: "15px",
            fontSize: "0.85rem",
            color: "#666",
            textAlign: "left",
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={(e) =>
              setFormData({ ...formData, acceptTerms: e.target.checked })
            }
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
              marginRight: "8px",
            }}
          />
          <span>I agree to </span>
          <span
            onClick={() => setShowTermsModal(true)}
            style={{
              color: "#ff0f8b",
              cursor: "pointer",
              textDecoration: "underline",
              marginLeft: "4px",
            }}
          >
            Terms & Conditions
          </span>
        </div>

        <button
          type="submit"
          className="auth-btn"
          style={{ marginTop: "20px" }}
          disabled={isLoadingButton}
        >
          {isLoadingButton ? (
            <span className="login-btn-loader"></span>
          ) : (
            "Login"
          )}
        </button>
        <button
          type="button"
          onClick={() => dispatch(setView("register"))}
          className="toggle-btn"
        >
          New to HylooSec? Create an account
        </button>
        <span
          onClick={() => dispatch(setView("about"))}
          style={{
            cursor: "pointer",
            fontSize: "0.85rem",
            color: "#666666",
            padding: "6px 0px 0px 0px",
            margin: "6px 0px 0px 0px",
          }}
        >
          What is HylooSec? Learn more
        </span>
      </form>

      {showModal && (
        <SecurityModal
          userData={tempData}
          onSuccess={handleSecuritySuccess}
          onClose={() => setShowModal(false)}
        />
      )}
      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setFormData({ ...formData, acceptTerms: true });
            setShowTermsModal(false);
          }}
        />
      )}
    </>
  );
};

export default Login;
