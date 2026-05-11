import React, { useState } from "react";
import { Lock, FileKey, ShieldCheck, X } from "lucide-react";
import {
  decryptText,
  encryptText,
  decryptWithPin,
} from "../../../utils/cryptoUtils";
import "./SecurityModal.css";

const SecurityModal = ({ userData, onSuccess, onClose }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      // cryptoUtils mein decryptWithPin function hona chahiye
      const privateKey = await decryptWithPin(
        userData.encryptedPrivateKey,
        pin,
        userData.keyIv,
      );
      onSuccess(privateKey);
    } catch (err) {
      setError("Incorrect PIN. Decryption failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const uploadedKey = event.target.result; // Raw content lo, clean cryptoUtils karega

      try {
        const testMessage = "verify-me";

        // 1. Encrypt with public key from backend
        const encrypted = await encryptText(testMessage, userData.publicKey);

        // 2. Decrypt with uploaded key
        const decrypted = await decryptText(encrypted, uploadedKey);

        // 3. Match check
        if (decrypted === testMessage) {
          onSuccess(uploadedKey); // Everything OK!
        } else {
          setError("Security Mismatch: This key is not for this account.");
        }
      } catch (err) {
        setError("Invalid Key File: Could not process this file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card fade-in">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="icon-circle">
            <ShieldCheck size={30} className="shield-icon" />
          </div>
          <h3>Security Layer</h3>
          <p>Verify your identity to access end-to-end encrypted chats.</p>
        </div>

        {userData.securityType === "PIN" ? (
          <div className="security-body">
            <div className="pin-input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Enter 6-digit PIN"
                maxLength="6"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <p className="modal-error">{error}</p>}
            <button
              onClick={handlePinUnlock}
              className="auth-btn"
              disabled={pin.length < 4 || loading}
            >
              {loading ? "Decrypting..." : "Unlock Chats"}
            </button>
          </div>
        ) : (
          <div className="security-body">
            <label className="file-drop-zone">
              <FileKey size={40} className="file-icon" />
              <span>Click to upload Secret Key file</span>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                hidden
              />
            </label>
            {error && <p className="modal-error">{error}</p>}
            <p className="helper-text">
              Please use the .txt file downloaded during registration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityModal;
