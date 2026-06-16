// src/utils/cryptoUtils.js
import LZString from "lz-string";

export const uint8ArrayToBase64 = (bytes) => {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const base64ToUint8Array = (base64) => {
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
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  let packageObj;

  if (data.length < 190) {
    const encrypted = await encryptText_RSA(text, publicKeyStr);
    packageObj = { mode: "rsa", data: encrypted };
  } else {
    const aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"],
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      data,
    );

    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await encryptText_RSA(
      uint8ArrayToBase64(new Uint8Array(exportedAesKey)),
      publicKeyStr,
    );

    packageObj = {
      mode: "hybrid",
      iv: uint8ArrayToBase64(iv),
      data: uint8ArrayToBase64(new Uint8Array(encryptedData)),
      key: encryptedAesKey,
    };
  }

  // यहाँ हमने compressToUTF16 के बजाय compress का इस्तेमाल किया है
  // यह अधिक कॉम्पैक्ट है और डेटाबेस में कम जगह लेता है
  return LZString.compressToBase64(JSON.stringify(packageObj));
};

export const decryptText = async (compressedData, privateKeyStr) => {
  try {
    // यहाँ हमने decompress का इस्तेमाल किया है
    const decompressed = LZString.decompressFromBase64(compressedData);
    const payload = JSON.parse(decompressed);

    if (payload.mode === "rsa") {
      return await decryptText_RSA(payload.data, privateKeyStr);
    } else if (payload.mode === "hybrid") {
      const aesKeyB64 = await decryptText_RSA(payload.key, privateKeyStr);
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        base64ToUint8Array(aesKeyB64),
        { name: "AES-GCM" },
        true,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToUint8Array(payload.iv) },
        aesKey,
        base64ToUint8Array(payload.data),
      );
      return new TextDecoder().decode(decrypted);
    }
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
};

const encryptText_RSA = async (text, publicKeyStr) => {
  const encoder = new TextEncoder();
  const data =
    typeof text === "string" ? encoder.encode(text) : base64ToUint8Array(text);
  const binaryKey = base64ToUint8Array(publicKeyStr);
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    data,
  );
  return uint8ArrayToBase64(new Uint8Array(encrypted));
};

const decryptText_RSA = async (encryptedBase64, privateKeyStr) => {
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
    ["decrypt"],
  );
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToUint8Array(encryptedBase64),
  );
  return new TextDecoder().decode(decryptedBuffer);
};

export const encryptWithPin = async (privateKeyStr, pin) => {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

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
    ["encrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encoder.encode(privateKeyStr),
  );

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

    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

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
      ["decrypt"],
    );

    const iv = base64ToUint8Array(ivB64);
    const encryptedData = base64ToUint8Array(encryptedKeyB64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedData,
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid PIN or corrupted key data");
  }
};

export const generateAESKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

// 1. फाइल और फाइल नेम एन्क्रिप्शन (Unified)
export const encryptFileInChunks = async (file, aesKey) => {
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const encryptedChunks = [];
  let offset = 0;

  // एन्क्रिप्टेड फाइल डेटा के लिए लूप
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const chunkBuffer = await chunk.arrayBuffer();

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      chunkBuffer,
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(4 + iv.length + encryptedArray.length);

    new DataView(combined.buffer).setUint32(0, encryptedArray.length);
    combined.set(iv, 4);
    combined.set(encryptedArray, 16); // 4 + 12

    encryptedChunks.push(combined);
    offset += CHUNK_SIZE;
  }
  return new Blob(encryptedChunks);
};

// 2. फाइल नेम एन्क्रिप्शन (Simple & Secure)
export const encryptFileName = async (fileName, aesKey) => {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(fileName),
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return uint8ArrayToBase64(combined);
};

// 3. फाइल डिक्रिप्शन
export const decryptFileInChunks = async (encryptedBlob, aesKey) => {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const uint8View = new Uint8Array(arrayBuffer);
  const decryptedChunks = [];
  let offset = 0;

  while (offset < uint8View.length) {
    // DataView को सही offset पर पॉइंट करें
    const view = new DataView(uint8View.buffer, uint8View.byteOffset + offset);
    const dataLength = view.getUint32(0);

    const iv = uint8View.slice(offset + 4, offset + 16);
    const data = uint8View.slice(offset + 16, offset + 16 + dataLength);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      data,
    );
    decryptedChunks.push(decrypted);

    offset += 16 + dataLength;
  }
  return new Blob(decryptedChunks);
};

// 4. फाइल नेम डिक्रिप्शन
export const decryptFileName = async (encryptedNameBase64, aesKey) => {
  const combined = base64ToUint8Array(encryptedNameBase64);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data,
  );
  return new TextDecoder().decode(decrypted);
};
