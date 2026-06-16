import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setView, setVerificationStatus, clearMessages } from "../../Slice/authSlice";
import { jsPDF } from "jspdf";

const SuccessInfo = () => {
  const dispatch = useDispatch();
  const { registrationData, isVerified } = useSelector((state) => state.auth);
  const pdfGenerated = useRef(false);

  useEffect(() => {
    const createPdf = async () => {
      if (pdfGenerated.current || !registrationData || isVerified) return;
      pdfGenerated.current = true;

      const { userId, username, password, fatherName, dob, securityQuestion, securityAnswer, securityType, country, city, ip } = registrationData;

      try {
        const doc = new jsPDF();

        // PDF Content
        doc.setFontSize(18);
        doc.text("HYLOOSEC - OFFICIAL CREDENTIALS", 20, 20);
        doc.line(20, 25, 190, 25);

        doc.setFontSize(12);
        doc.text(`User ID: ${userId}`, 20, 40);
        doc.text(`Full Name: ${username}`, 20, 50);
        doc.text(`Password: ${password}`, 20, 60);
        doc.text(`Father's Name: ${fatherName}`, 20, 70);
        doc.text(`Date of Birth: ${dob}`, 20, 80);

        doc.text("CRITICAL RECOVERY DATA:", 20, 100);
        doc.text(`Security Question: ${securityQuestion}`, 20, 110);
        doc.text(`Security Answer: ${securityAnswer}`, 20, 120);

        doc.text("ENCRYPTION & SYSTEM INFO:", 20, 140);
        doc.text(`Security Type: ${securityType}`, 20, 150);
        doc.text(`Registered From: ${city}, ${country}`, 20, 160);
        doc.text(`IP Address: ${ip}`, 20, 170);

        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 190);

        // PDF download without encryption
        doc.save(`hyloosec_credentials_${userId}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
      }
    };

    createPdf();
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
    <div className="success-container fade-in" style={{ padding: "20px", textAlign: "center" }}>
      <h2 className="Welcome">{isVerified ? "Update Successful!" : "Account Created!"}</h2>
      <p className="subtitle">
        {isVerified ? "Your profile has been updated." : "Your recovery credentials PDF has been downloaded automatically."}
      </p>

      <div className="info-box" style={{ margin: "20px 0", padding: "10px", border: "1px dashed #aaa" }}>
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