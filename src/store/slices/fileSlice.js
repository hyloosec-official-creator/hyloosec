import { createSlice } from "@reduxjs/toolkit";

const fileSlice = createSlice({
  name: "fileManager",
  initialState: {
    chatFiles: {},
  },
  reducers: {
    setChatFile: (state, action) => {
      const { chatId, fileData } = action.payload;
      if (!state.chatFiles[chatId]) {
        state.chatFiles[chatId] = [];
      }
      state.chatFiles[chatId].push(fileData);
    },
    removeSingleFile: (state, action) => {
      const { chatId, index } = action.payload;
      if (state.chatFiles[chatId]) {
        state.chatFiles[chatId].splice(index, 1);
      }
    },
    removeChatFile: (state, action) => {
      const { chatId } = action.payload;
      delete state.chatFiles[chatId];
    },
    clearAllFiles: (state) => {
      state.chatFiles = {};
    },
    loadChatFiles: (state, action) => {
    const { chatId, files } = action.payload;
    state.chatFiles[chatId] = files;
}
  },
});

export const { setChatFile, removeSingleFile, removeChatFile, clearAllFiles, loadChatFiles, } =
  fileSlice.actions;
export default fileSlice.reducer;
