// src/utils/cryptoUtils.js

const uint8ArrayToBase64 = (bytes) => {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToUint8Array = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// 1. Generate RSA Key Pair (Public & Private)
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  // Export keys to string format for storage/download
  const publicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  );

  return {
    publicKey: uint8ArrayToBase64(new Uint8Array(publicKey)),
    privateKey: uint8ArrayToBase64(new Uint8Array(privateKey)),
  };
};

export const encryptText = async (text, publicKeyStr) => {
  if (!publicKeyStr) throw new Error("Public Key string is empty");

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const binaryKey = base64ToUint8Array(publicKeyStr);

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data);
  return uint8ArrayToBase64(new Uint8Array(encrypted));
};

export const decryptText = async (encryptedBase64, privateKeyStr) => {
  try {
    const cleanKey = privateKeyStr
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\s/g, "");

    const binaryKey = base64ToUint8Array(cleanKey);
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );

    const encryptedData = base64ToUint8Array(encryptedBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedData);

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Deep Decryption Error:", e);
    return null;
  }
};

export const encryptWithPin = async (privateKeyStr, pin) => {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]);

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("me-and-you-app-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aesKey, encoder.encode(privateKeyStr));

  return {
    encryptedKey: uint8ArrayToBase64(new Uint8Array(encrypted)),
    iv: uint8ArrayToBase64(iv),
  };
};

// 5. Decrypt Private Key with PIN
export const decryptWithPin = async (encryptedKeyB64, pin, ivB64) => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const baseKey = await window.crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]);

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("me-and-you-app-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );

    const iv = base64ToUint8Array(ivB64);
    const encryptedData = base64ToUint8Array(encryptedKeyB64);

    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, aesKey, encryptedData);

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid PIN or corrupted key data");
  }
};

export const generateAESKey = async () => {
  return await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
};

// 7. File Encryption
export const encryptFileNative = async (file, aesKey, onProgress) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const arrayBuffer = await file.arrayBuffer();

  const encryptedBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aesKey, arrayBuffer);

  const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const aesKeyBase64 = uint8ArrayToBase64(new Uint8Array(exportedKey));
  const ivBase64 = uint8ArrayToBase64(iv);

  const finalBlob = new Blob([encryptedBuffer], { type: "application/octet-stream" });

  if (onProgress) onProgress(100);

  return { finalBlob, aesKeyBase64, ivBase64 };
};
