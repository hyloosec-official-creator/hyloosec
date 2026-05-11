import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setView, setVerificationStatus, clearMessages } from "../../Slice/authSlice";

const SuccessInfo = () => {
  const dispatch = useDispatch();
  const { registrationData, isVerified } = useSelector((state) => state.auth);

  console.log("Current isVerified status:", isVerified);
  if (!registrationData) {
    dispatch(setView("login"));
    return null;
  }

  const handleFinish = () => {
    dispatch(setVerificationStatus(false)); 
    dispatch(clearMessages());
    dispatch(setView("login"));
  };

  return (
    <div className="success-container fade-in">
      <h2 className="Welcome">
        {isVerified ? "Update Successful!" : "Account Created!"}
      </h2>
      
      <p className="subtitle">Please save your credentials carefully:</p>
      
      <div className="info-box">
        <div className="info-item">
          <strong>User ID:</strong> <span>{registrationData.userId}</span>
        </div>

        <div className="info-item">
          <strong>Password:</strong> <span>{registrationData.password}</span>
        </div>
      </div>

      <button onClick={handleFinish} className="auth-btn">
        Go to Login
      </button>
    </div>
  );
};

export default SuccessInfo;