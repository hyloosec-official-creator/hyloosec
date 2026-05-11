import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    isAuthenticated: false,
    token: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.token = action.payload.token || null;
    },
    updateProfile: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
    },
  },
});

export const { setUser, logout, updateProfile } = userSlice.actions;
export default userSlice.reducer;