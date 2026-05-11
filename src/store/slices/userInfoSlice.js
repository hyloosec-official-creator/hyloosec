import { createSlice } from "@reduxjs/toolkit";

const userInfoSlice = createSlice({
  name: "userInfo",
  initialState: {
    profiles: {}, // Store structure: { "1020304050": { bio: "...", username: "...", profilePic: "..." } }
  },
  reducers: {
    // For individual profile updates (like single search result)
    setProfileCache: (state, action) => {
      const { userId, data } = action.payload;
      state.profiles[userId] = data;
    },

    // NEW: Handle the array from the Java Spring Boot /bulk-profiles endpoint
    setBulkProfiles: (state, action) => {
      const usersArray = action.payload; // Expecting an array of user objects
      usersArray.forEach((user) => {
        if (user.userId) {
          state.profiles[user.userId] = {
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
          };
        }
      });
    },

    // NEW: Specifically for adding a user discovered via search
    addSingleProfile: (state, action) => {
      const user = action.payload;
      state.profiles[user.userId] = user;
    }
  },
});

// Export all actions so Home.jsx and SearchBar.jsx can use them
export const { setProfileCache, setBulkProfiles, addSingleProfile } = userInfoSlice.actions;
export default userInfoSlice.reducer;