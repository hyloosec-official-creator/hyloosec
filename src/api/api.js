import axios from 'axios';
import { store } from '../store/store'; // Adjust path to your store.js

const API = axios.create({
  baseURL: 'https://HylooSec-node-backend.onrender.com/api', // Your Node.js server
});

// This "Interceptor" runs before every request
API.interceptors.request.use((config) => {
  // Pull the token from your authSlice (Redux)
  const state = store.getState();
  const token = state.auth.token; 

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;