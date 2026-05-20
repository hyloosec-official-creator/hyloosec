import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setView, setVerificationStatus, clearMessages } from "../../Slice/authSlice";

const SuccessInfo = () => {
  const dispatch = useDispatch();
  const { registrationData, isVerified } = useSelector((state) => state.auth);

  useEffect(() => {
    // अगर रजिस्ट्रेशन डेटा मौजूद है और यह फ्रेश अकाउंट है, तो ही डाउनलोड करो
    if (registrationData && !isVerified) {
      // Create.jsx से भेजा गया सारा डेटा यहाँ डीस्ट्रक्चर कर लिया
      const { 
        userId, 
        username, 
        password, 
        fatherName, 
        dob, 
        securityQuestion, 
        securityAnswer, 
        securityType,
        country,
        city,
        ip
      } = registrationData;

      // सुरक्षा सवाल को इंसानी भाषा में बदलने के लिए मैपिंग
      const questionMapping = {
        father: "What is your Father name?",
        mother: "What is your Mother name?",
        friend: "What is your best friend name?",
        pet: "What is your pet's name?",
        city: "What city were you born in?"
      };

      const fullQuestion = questionMapping[securityQuestion] || securityQuestion;

      const fileContent = `=====================================================
          HYLOOSEC (Me & You) - OFFICIAL CREDENTIALS
=====================================================
REGISTRATION DETAILS:
-----------------------------------------------------
User ID          : ${userId}
Full Name        : ${username}
Password         : ${password}
Father's Name    : ${fatherName}
Date of Birth    : ${dob}

-----------------------------------------------------
CRITICAL FORGET PASSWORD / IDENTITY RECOVERY DATA:
-----------------------------------------------------
* यदि आप अपना पासवर्ड भूल जाते हैं, तो रीसेट करने के लिए
  नीचे दिए गए सवाल और जवाब का हुबहू मैच होना अनिवार्य है।

Security Question: ${fullQuestion}
Security Answer  : ${securityAnswer}

-----------------------------------------------------
ENCRYPTION & SYSTEM INFO:
-----------------------------------------------------
Security Type    : ${securityType} (Chats Security Mode)
Registered From  : ${city}, ${country}
Registration IP  : ${ip}

=====================================================
IMPORTANT SECURITY INSTRUCTIONS:
1. Please SAVE this file in a safe, private place (PenDrive or Secure Cloud).
2. Do not share this file, User ID, or Password with anyone.
3. If your password is lost, it CANNOT be recovered without the Security Answer.
=====================================================
Generated on     : ${new Date().toLocaleString()}
`;

      // 1. Blob बनाना
      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;

      // 2. आपका पसंदीदा फाइल नाम फॉर्मेट
      link.setAttribute("download", `hyloosec_${username || "user"}_credential_${userId}.txt`);

      // 3. डाउनलोड ट्रिगर करना
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [registrationData, isVerified]);

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

      <p className="subtitle">
        {isVerified 
          ? "Your profile has been updated." 
          : "Your recovery credentials file has been downloaded automatically. Keep it safe!"}
      </p>

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