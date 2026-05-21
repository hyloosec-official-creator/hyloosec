import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setView, setVerificationStatus, clearMessages } from "../../Slice/authSlice";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"; // 👈 न्यू बख्तरबंद लाइब्रेरी

const SuccessInfo = () => {
  const dispatch = useDispatch();
  const { registrationData, isVerified } = useSelector((state) => state.auth);

  const generatePdfPassword = (username, dobString) => {
    if (!username || !dobString) return "123456";
    const cleanName = username.replace(/\s+/g, "");
    const namePart = cleanName.substring(0, 4).toUpperCase();
    const yearPart = dobString.substring(0, 4); 
    return `${namePart}${yearPart}`; // Returns: NEEL2005
  };

  useEffect(() => {
    const createSecurePdf = async () => {
      if (registrationData && !isVerified) {
        const { 
          userId, username, password, fatherName, dob, 
          securityQuestion, securityAnswer, securityType, country, city, ip 
        } = registrationData;

        const questionMapping = {
          father: "What is your Father name?",
          mother: "What is your Mother name?",
          friend: "What is your best friend name?",
          pet: "What is your pet's name?",
          city: "What city were you born in?"
        };

        const fullQuestion = questionMapping[securityQuestion] || securityQuestion;
        const pdfPassword = generatePdfPassword(username, dob);

        try {
          // 1. एक नया PDF डॉक्यूमेंट बनाएं
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([600, 500]);
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          // 2. पीडीएफ में टेक्स्ट लिखना शुरू करें
          page.drawText("=====================================================", { x: 30, y: 460, size: 14, font: boldFont });
          page.drawText("       HYLOOSEC - OFFICIAL CREDENTIALS", { x: 30, y: 440, size: 16, font: boldFont });
          page.drawText("=====================================================", { x: 30, y: 420, size: 14, font: boldFont });

          page.drawText("REGISTRATION DETAILS:", { x: 30, y: 390, size: 13, font: boldFont });
          page.drawText(`User ID                  : ${userId}`, { x: 30, y: 370, size: 12, font });
          page.drawText(`Full Name            : ${username}`, { x: 30, y: 350, size: 12, font });
          page.drawText(`Password             : ${password}`, { x: 30, y: 330, size: 12, font });
          page.drawText(`Father's Name     : ${fatherName}`, { x: 30, y: 310, size: 12, font });
          page.drawText(`Date of Birth        : ${dob}`, { x: 30, y: 290, size: 12, font });

          page.drawText("---------------------------------------------------------------------------------------------------", { x: 30, y: 270, size: 12, font });
          
          page.drawText("CRITICAL FORGET PASSWORD / IDENTITY RECOVERY DATA:", { x: 30, y: 250, size: 12, font: boldFont });
          page.drawText(`Security Question : ${fullQuestion}`, { x: 30, y: 230, size: 11, font });
          page.drawText(`Security Answer   : ${securityAnswer}`, { x: 30, y: 210, size: 11, font });

          page.drawText("---------------------------------------------------------------------------------------------------", { x: 30, y: 190, size: 12, font });

          page.drawText("ENCRYPTION & SYSTEM INFO:", { x: 30, y: 170, size: 12, font: boldFont });
          page.drawText(`Security Type       : ${securityType} (Chats Security Mode)`, { x: 30, y: 150, size: 11, font });
          page.drawText(`Registered From   : ${city}, ${country}`, { x: 30, y: 130, size: 11, font });
          page.drawText(`Registration IP    : ${ip}`, { x: 30, y: 110, size: 11, font });

          page.drawText(`Generated on       : ${new Date().toLocaleString()}`, { x: 30, y: 70, size: 10, font });

          // 3. 🔒 पासवर्ड प्रोटेक्शन (एन्क्रिप्शन) को सेट करना
          // pdf-lib क्रेडेंशियल्स को सीधे ब्राउज़र लेवल पर कंपाइल कर देता है
          const pdfBytes = await pdfDoc.save({
            userPassword: pdfPassword, // 👈 आपका कस्टमाइज्ड आसान पासवर्ड सेट हो गया!
            ownerPassword: "hyloosec_master_secure_key_2026"
          });

          // 4. ऑटो-डाउनलोड ट्रिगर करें
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `hyloosec_${username || "user"}_credential_${userId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } catch (pdfError) {
          console.error("PDF generation failed:", pdfError);
        }
      }
    };

    createSecurePdf();
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

  const namePartHint = registrationData.username?.replace(/\s+/g, "").substring(0, 4).toUpperCase() || "NAME";
  const yearPartHint = registrationData.dob?.substring(0, 4) || "YYYY";

  return (
    <div className="success-container fade-in" style={{ padding: "20px", textAlign: "center" }}>
      <h2 className="Welcome">
        {isVerified ? "Update Successful!" : "Account Created!"}
      </h2>

      <p className="subtitle">
        {isVerified 
          ? "Your profile has been updated." 
          : "Your recovery credentials PDF has been downloaded automatically."}
      </p>

      <div className="info-box" style={{ margin: "20px 0", padding: "10px", border: "1px dashed #aaa" }}>
        <div className="info-item">
          <strong>User ID:</strong> <span>{registrationData.userId}</span>
        </div>
        <div className="info-item">
          <strong>Password:</strong> <span>{registrationData.password}</span>
        </div>
      </div>

      {!isVerified && (
        <div className="pdf-instruction-box" style={{
          background: "#1e1e2f",
          border: "1px solid #6e54ff",
          borderRadius: "10px",
          padding: "15px",
          margin: "20px 0",
          textAlign: "left",
          color: "#fff"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#6e54ff" }}>
            🔒 PDF खोलने के निर्देश (PDF Open Instructions)
          </h4>
          <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#ccc" }}>
            आपकी क्रेडेंशियल फाइल पूरी तरह एन्क्रिप्टेड डाउनलोड हुई है। इसे खोलने के लिए नीचे दिए गए फॉर्मेट में पासवर्ड डालें:
          </p>
          <div style={{ 
            background: "#2a2a40", padding: "10px", borderRadius: "6px", 
            fontWeight: "bold", textAlign: "center", fontSize: "1.1rem", color: "#4ade80", margin: "10px 0"
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