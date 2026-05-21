import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setView, setVerificationStatus, clearMessages } from "../../Slice/authSlice";
import { jsPDF } from "jspdf"; 

const SuccessInfo = () => {
  const dispatch = useDispatch();
  const { registrationData, isVerified } = useSelector((state) => state.auth);

  // 🔐 पासवर्ड जेनरेट करने वाला हेल्पर फंक्शन (Name's 4 Letters + DOB Year)
  const generatePdfPassword = (username, dobString) => {
    if (!username || !dobString) return "123456"; // Fallback सुरक्षा के लिए
    
    // 1. नाम से स्पेस हटाकर पहले 4 अक्षर निकालें और कैपिटल करें
    const cleanName = username.replace(/\s+/g, "");
    const namePart = cleanName.substring(0, 4).toUpperCase();
    
    // 2. DOB (YYYY-MM-DD) से सिर्फ साल (Year) निकालें
    const yearPart = dobString.substring(0, 4); 
    
    return `${namePart}${yearPart}`; // Returns: NEEL2002
  };

  useEffect(() => {
    if (registrationData && !isVerified) {
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

      const questionMapping = {
        father: "What is your Father name?",
        mother: "What is your Mother name?",
        friend: "What is your best friend name?",
        pet: "What is your pet's name?",
        city: "What city were you born in?"
      };

      const fullQuestion = questionMapping[securityQuestion] || securityQuestion;

      // 🎯 नया आसान पासवर्ड बनाएं (जैसे: NEEL2002)
      const pdfPassword = generatePdfPassword(username, dob);

      // =====================================================
      // 🔒 jsPDF ENCRYPTION
      // =====================================================
      const doc = new jsPDF();

      doc.setEncryption({
        userPassword: pdfPassword, // 👈 अब यह आपका कस्टमाइज्ड आसान पासवर्ड है!
        ownerPassword: "hyloosec_master_secure_key_2026",
        permissions: ["print", "copy"]
      });

      // --- PDF Content Writing ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("=====================================================", 10, 20);
      doc.text("     HYLOOSEC - OFFICIAL CREDENTIALS", 10, 30);
      doc.text("=====================================================", 10, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.setFont("helvetica", "bold");
      doc.text("REGISTRATION DETAILS:", 10, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`User ID          : ${userId}`, 10, 65);
      doc.text(`Full Name        : ${username}`, 10, 75);
      doc.text(`Password         : ${password}`, 10, 85);
      doc.text(`Father's Name    : ${fatherName}`, 10, 95);
      doc.text(`Date of Birth    : ${dob}`, 10, 105);

      doc.text("---------------------------------------------------------------------------------------------------", 10, 115);
      doc.setFont("helvetica", "bold");
      doc.text("CRITICAL FORGET PASSWORD / IDENTITY RECOVERY DATA:", 10, 125);
      doc.setFont("helvetica", "normal");
      doc.text("* If you forget your password, this exact question/answer match is mandatory.", 10, 133);
      doc.text(`Security Question: ${fullQuestion}`, 10, 143);
      doc.text(`Security Answer  : ${securityAnswer}`, 10, 153);

      doc.text("---------------------------------------------------------------------------------------------------", 10, 163);
      doc.setFont("helvetica", "bold");
      doc.text("ENCRYPTION & SYSTEM INFO:", 10, 173);
      doc.setFont("helvetica", "normal");
      doc.text(`Security Type    : ${securityType} (Chats Security Mode)`, 10, 183);
      doc.text(`Registered From  : ${city}, ${country}`, 10, 193);
      doc.text(`Registration IP  : ${ip}`, 10, 203);

      doc.text("=====================================================", 10, 218);
      doc.setFont("helvetica", "bold");
      doc.text("IMPORTANT SECURITY INSTRUCTIONS:", 10, 226);
      doc.setFont("helvetica", "normal");
      doc.text("1. Please SAVE this PDF in a safe, private place (PenDrive or Secure Cloud).", 10, 234);
      doc.text(`2. The password to open this PDF is your Name's first 4 letters in CAPITAL + your DOB Year.`, 10, 242);
      doc.text(`Generated on     : ${new Date().toLocaleString()}`, 10, 255);

      // PDF सेव करें
      doc.save(`hyloosec_${username || "user"}_credential_${userId}.pdf`);
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

  // UI रेंडरिंग के लिए पासवर्ड का हिंट निकाल रहे हैं
  const namePartHint = registrationData.username?.replace(/\s+/g, "").substring(0, 4).toUpperCase() || "NAME";
  const yearPartHint = registrationData.dob?.substring(0, 4) || "YYYY";

  return (
    <div className="success-container fade-in">
      <h2 className="Welcome">
        {isVerified ? "Update Successful!" : "Account Created!"}
      </h2>

      <p className="subtitle">
        {isVerified 
          ? "Your profile has been updated." 
          : "Your recovery credentials PDF has been downloaded automatically."}
      </p>

      <div className="info-box">
        <div className="info-item">
          <strong>User ID:</strong> <span>{registrationData.userId}</span>
        </div>
        <div className="info-item">
          <strong>Password:</strong> <span>{registrationData.password}</span>
        </div>
      </div>

      {/* ✅ नीचे स्क्रीन पर खोलने का निर्देश बॉक्स */}
      {!isVerified && (
        <div className="pdf-instruction-box" style={{
          background: "#1e1e2f",
          border: "1px solid #6e54ff",
          borderRadius: "10px",
          padding: "15px",
          margin: "20px 0",
          textAlign: "left",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(110, 84, 255, 0.2)"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#6e54ff", display: "flex", alignItems: "center", gap: "5px" }}>
            🔒 PDF खोलने के निर्देश (PDF Open Instructions)
          </h4>
          <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#ccc" }}>
            आपकी क्रेडेंशियल फाइल पूरी तरह एन्क्रिप्टेड डाउनलोड हुई है। इसे खोलने के लिए नीचे दिए गए फॉर्मेट में पासवर्ड डालें:
          </p>
          <div style={{ 
            background: "#2a2a40", 
            padding: "10px", 
            borderRadius: "6px", 
            fontWeight: "bold", 
            textAlign: "center",
            fontSize: "1.1rem",
            color: "#4ade80",
            margin: "10px 0"
          }}>
            {namePartHint}{yearPartHint}
          </div>
          <p style={{ margin: "0", fontSize: "0.8rem", color: "#888" }}>
            (Format: आपके नाम के पहले 4 अक्षर CAPITAL में + आपकी जन्म का साल)
          </p>
        </div>
      )}

      <button onClick={handleFinish} className="auth-btn">
        Go to Login
      </button>
    </div>
  );
};

export default SuccessInfo;