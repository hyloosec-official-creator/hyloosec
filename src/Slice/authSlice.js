import { createSlice } from "@reduxjs/toolkit";

// ✅ 1. DEFINE IT FIRST
const loadUser = () => {
  try {
    const serializedUser = localStorage.getItem("user");
    // Hard check for the string "undefined"
    if (
      !serializedUser ||
      serializedUser === "undefined" ||
      serializedUser === "null"
    ) {
      return null;
    }
    return JSON.parse(serializedUser);
  } catch (err) {
    return null;
  }
};

// ✅ 2. THEN CALL IT
const savedUser = loadUser();

const initialState = {
  user: savedUser,
  token: localStorage.getItem("token") || null,
  view: savedUser ? "chat" : "login", // Only show chat if we actually have a user
  registrationData: null,
  isVerified: false,
  error: "",
  success: "",
  isSessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setRegistrationData: (state, action) => {
      state.registrationData = action.payload;
    },
    setView: (state, action) => {
      state.view = action.payload;
      state.error = "";
      state.success = "";
      if (action.payload !== "success") {
        state.registrationData = null;
        state.isVerified = false;
      }
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.success = "";
    },
    setAuthSuccess: (state, action) => {
      state.success = action.payload;
      state.error = "";
    },
    setVerificationStatus: (state, action) => {
      state.isVerified = action.payload;
    },
    loginUser: (state, action) => {
      const data = action.payload;
      const userData = data.user ? data.user : data;

      // Sahi tarika: User data aur decrypted key ko merge karein
      state.user = {
        ...userData,
        privateKey: data.decryptedKey || userData.privateKey,
      };

      state.token = data.token || null;

      if (state.user) {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
      if (state.token) {
        localStorage.setItem("token", state.token);
      }

      state.error = "";
      state.view = "chat";
    },
    clearMessages: (state) => {
      state.error = "";
      state.success = "";
    },
    setSessionExpired: (state, action) => {
      state.isSessionExpired = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null; // ✅ 4. Clear token in state
      state.isSessionExpired = false;
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // ✅ 5. Remove from localStorage
      state.view = "login";
    },
  },
});

export const {
  setView,
  setRegistrationData,
  setAuthError,
  setAuthSuccess,
  setVerificationStatus,
  loginUser,
  clearMessages,
  setSessionExpired,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
