import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { JavaAPI } from "../../api/api";
import {
  setView,
  setAuthError,
  setAuthSuccess,
  setVerificationStatus,
  clearMessages,
  setRegistrationData, // <--- ADD THIS
} from "../../Slice/authSlice";

const Forgot = () => {
  const dispatch = useDispatch();
  const { isVerified, error, success } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    userId: "",
    dob: "",
    securityQuestion: "",
    securityAnswer: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    if (error) dispatch(clearMessages());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await JavaAPI.post("/auth/verify-identity", {
        userId: formData.userId,
        dob: formData.dob,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
      });

      if (response.status === 200) {
        dispatch(setVerificationStatus(true));
        dispatch(clearMessages());
      }
    } catch (err) {
      const msg = err.response?.data || "Incorrect details. Please verify.";
      dispatch(setAuthError(msg));
      setFormData({ ...formData, dob: "", securityAnswer: "" });
    }
  };

  const handleReset = async (e) => {
  e.preventDefault();

  if (formData.newPassword !== formData.confirmPassword) {
    dispatch(setAuthError("Passwords do not match!"));
    return;
  }

  try {
    const response = await JavaAPI.post("/auth/reset-password", {
      userId: formData.userId,
      password: formData.newPassword,
    });

    if (response.status === 200) {
      dispatch(
        setRegistrationData({
          userId: formData.userId,
          password: formData.newPassword,
        })
      );
      
      dispatch(setView("success"));
    }
  } catch (err) {
    dispatch(setAuthError("Failed to update password. Please try again."));
  }
};
  return (
    <div className="forgot-container">
      {!isVerified ? (
        <form className="forgot fade-in" onSubmit={handleVerify}>
          <h2 className="verify">Verify Identity</h2>
          <div className="input-form">
            <input
              name="userId"
              type="text"
              placeholder="User Id"
              required
              value={formData.userId}
              onChange={handleChange}
            />
            <input
              name="dob"
              type={formData.dob ? "date" : "text"}
              placeholder="Date of Birth"
              required
              value={formData.dob}
              onChange={handleChange}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => !formData.dob && (e.target.type = "text")}
            />
            <select
              name="securityQuestion"
              className="security-select"
              required
              onChange={handleChange}
              value={formData.securityQuestion}
            >
              <option value="" disabled>
                Select Security Question
              </option>
              <option value="father">What is your Father name?</option>
              <option value="mother">What is your Mother name?</option>
              <option value="friend">What is your best friend name?</option>
              <option value="pet">What is your pet's name?</option>
              <option value="city">What city were you born in?</option>
            </select>
            <input
              name="securityAnswer"
              type="text"
              placeholder="Your Answer"
              required
              value={formData.securityAnswer}
              onChange={handleChange}
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <button type="submit" className="auth-btn">
            Verify Details
          </button>
          <button
            type="button"
            className="toggle-btn"
            onClick={() => dispatch(setView("login"))}
          >
            Back to Login
          </button>
        </form>
      ) : (
        <form className="forgot fade-in" onSubmit={handleReset}>
          <h2 className="Welcome">New Password</h2>
          <div className="input-form">
            <input
              name="newPassword"
              type="password"
              placeholder="New Password"
              required
              value={formData.newPassword}
              onChange={handleChange}
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <button type="submit" className="auth-btn">
            Update Password
          </button>
        </form>
      )}
    </div>
  );
};

export default Forgot;