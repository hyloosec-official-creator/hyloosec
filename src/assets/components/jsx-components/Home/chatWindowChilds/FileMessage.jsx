import React, { useState, useEffect } from "react";
import {
  decryptText,
  decryptFileInChunks,
  decryptFileName,
  base64ToUint8Array,
} from "../../../../../utils/cryptoUtils";

const FileMessage = ({ file, isMe, privateKey, onDecrypt }) => {
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [originalName, setOriginalName] = useState(file.name);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  useEffect(() => {
    const decryptFile = async () => {
      if (!file?.url || !privateKey) return;

      try {
        setLoading(true);
        setError(false);

        // 1. AES Key को रिसीवर/सेंडर की प्राइवेट की से डिक्रिप्ट करें (Key Wrapping खोलें)
        const encKey = isMe
          ? file.encAesKeyForSender
          : file.encAesKeyForReceiver;
        const aesKeyRawB64 = await decryptText(encKey, privateKey);
        if (!aesKeyRawB64) throw new Error("RSA Decryption Failed");

        const binaryKey = base64ToUint8Array(aesKeyRawB64);
        const aesKey = await window.crypto.subtle.importKey(
          "raw",
          binaryKey,
          { name: "AES-GCM" },
          true,
          ["decrypt"],
        );

        // 2. फाइल का नाम डिक्रिप्ट करें
        const decryptedName = await decryptFileName(file.name, aesKey);
        setOriginalName(decryptedName);

        // 3. फाइल डेटा (Blob) फेच करें और चंक्स में डिक्रिप्ट करें
        const response = await fetch(file.url);
        const encryptedBlob = await response.blob();

        const decryptedBlob = await decryptFileInChunks(encryptedBlob, aesKey);

        const finalBlob = file.type.includes("pdf")
          ? new Blob([decryptedBlob], { type: "application/pdf" })
          : decryptedBlob;

        // 4. Blob URL बनाएं
        const objectUrl = URL.createObjectURL(finalBlob);
        setDecryptedUrl(objectUrl);

        if (onDecrypt) onDecrypt(objectUrl);
      } catch (err) {
        console.error("Decryption error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    decryptFile();

    return () => {
      if (decryptedUrl) URL.revokeObjectURL(decryptedUrl);
    };
  }, [file.url, privateKey, isMe, file.name]);

  if (loading) return <div className="file-loader">🔓 Decrypting...</div>;
  if (error)
    return <div className="file-error">⚠️ Error loading secure file</div>;

  // Render logic...
  if (file.type.startsWith("image/")) {
    return (
      <img
        src={decryptedUrl}
        className="decrypted-image-preview"
        alt={originalName}
        style={{ maxWidth: "100%" }}
      />
    );
  }

  if (file.type.startsWith("video/")) {
    return (
      <div className="video-wrapper">
        <video
          src={decryptedUrl}
          className="chat-video-native"
          style={{ maxWidth: "100%" }}
        />
      </div>
    );
  }

if (file.type.includes("pdf")) {
    return (
      <div className="pdf-container" style={{ width: "100%" }}>
        {/* PDF Card: Ye hamesha dikhega */}
        <div 
          className="pdf-card" 
          onClick={() => {
            if (window.innerWidth <= 800) {
              window.open(decryptedUrl, "_blank");
            } else {
              setIsPdfOpen(!isPdfOpen);
            }
          }}
        >
          <i className="ph ph-file-pdf"></i>
          <div className="pdf-info">
            <span>{originalName}</span>
            <small>{isPdfOpen ? "Click to collapse" : "Click to view PDF"}</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={decryptedUrl}
      download={originalName}
      className="file-download-link"
    >
      <i className="ph ph-download-simple"></i> Download {originalName}
    </a>
  );
};

export default FileMessage;
