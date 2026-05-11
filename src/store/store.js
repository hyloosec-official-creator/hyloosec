import { configureStore, combineReducers } from "@reduxjs/toolkit";
import fileReducer from './slices/fileSlice';
import chatReducer from './slices/chatSlice';
import userReducer from './slices/userSlice';
import authReducer from '../Slice/authSlice';
import sidebarReducer from "./slices/sidebarSlice";

// 1. Combine all your existing reducers
const appReducer = combineReducers({
  auth: authReducer,
  sidebar: sidebarReducer,
  fileManager: fileReducer,
  chat: chatReducer,
  user: userReducer,
});

// 2. Create a Root Reducer to handle the reset
const rootReducer = (state, action) => {
  // Replace 'auth/logout' with the actual type of your logout action 
  // (usually [sliceName]/[reducerName])
  if (action.type === 'auth/logout') {
    // This wipes the Redux state and returns it to initial values
    state = undefined; 
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer, // Use the rootReducer here
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});