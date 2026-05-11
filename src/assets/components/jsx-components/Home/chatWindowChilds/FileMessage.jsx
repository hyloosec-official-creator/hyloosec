import React, { useState, useEffect } from "react";
import { decryptText } from "../../../../../utils/cryptoUtils";

const FileMessage = ({ file, isMe, privateKey, onDecrypt }) => {
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const decryptFile = async () => {
      if (!file?.url || !privateKey) return;

      try {
        setLoading(true);
        setError(false);

        const encKey = isMe
          ? file.encAesKeyForSender
          : file.encAesKeyForReceiver;
        const aesKeyRawB64 = await decryptText(encKey, privateKey);
        if (!aesKeyRawB64) throw new Error("RSA Decryption Failed");

        const response = await fetch(file.url);
        const arrayBuffer = await response.arrayBuffer();

        const iv = Uint8Array.from(atob(file.iv.trim()), (c) =>
          c.charCodeAt(0),
        );
        const binaryKey = Uint8Array.from(atob(aesKeyRawB64.trim()), (c) =>
          c.charCodeAt(0),
        );

        const cryptoKey = await window.crypto.subtle.importKey(
          "raw",
          binaryKey,
          { name: "AES-GCM" },
          false,
          ["decrypt"],
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv },
          cryptoKey,
          arrayBuffer,
        );

        const blob = new Blob([decryptedBuffer], { type: file.type });
        const objectUrl = URL.createObjectURL(blob);

        setDecryptedUrl(objectUrl);
        if (onDecrypt) onDecrypt(objectUrl);
      } catch (err) {
        console.error("Decryption error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    decryptFile(); // 👈 Yeh call hona zaroori hai!

    return () => {
      if (decryptedUrl) URL.revokeObjectURL(decryptedUrl);
    };
  }, [file.url, privateKey, isMe]);

  if (loading) return <div className="file-loader">🔓 Decrypting...</div>;
  if (error)
    return <div className="file-error">⚠️ Error loading secure file</div>;

  // Render logic...
  if (file.type.startsWith("image/")) {
    return (
      <img
        src={decryptedUrl}
        className="decrypted-image-preview"
        alt={file.name}
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
      <div className="pdf-preview-card">
        <div className="pdf-icon-area">
          <i className="ph-fill ph-file-pdf"></i>
          <span>{file.name}</span>
        </div>
      </div>
    );
  }

  return (
    <a href={decryptedUrl} download={file.name}>
      📎 View {file.name}
    </a>
  );
};

export default FileMessage;
