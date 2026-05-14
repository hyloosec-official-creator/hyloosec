import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch the list of people the user has talked to
export const fetchAllChatData = createAsyncThunk(
  "sidebar/fetchAllChatData",
  async (userId) => {
    const response = await fetch(`https://HylooSec-node-backend.onrender.com/api/conversations/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return await response.json(); // Returns array of IDs like ['User1', 'User2']
  }
);

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState: {
    loading: false,
    error: null,
    searchQuery: "",
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllChatData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllChatData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchAllChatData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSearchQuery } = sidebarSlice.actions;
export default sidebarSlice.reducer;