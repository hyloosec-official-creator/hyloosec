import axios from "axios";
import { store } from "../store/store";
import { logout } from "../Slice/authSlice";

// अब हम सीधे अपने सब-डोमेन का उपयोग कर रहे हैं
const API_ENDPOINTS = {
  JAVA: {
    primary: "https://api.hyloosec.online/api" // Nginx इसे इंटरनली हैंडल करेगा
  },
  MONGO: {
    primary: "https://node.hyloosec.online/api" // Nginx इसे इंटरनली हैंडल करेगा
  }
};

export const MongoAPI = axios.create({ 
  baseURL: API_ENDPOINTS.MONGO.primary, 
  withCredentials: true 
});

export const JavaAPI = axios.create({ 
  baseURL: API_ENDPOINTS.JAVA.primary, 
  withCredentials: true 
});

const setupAuthInterceptors = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response } = error;

      // 401 एरर पर ऑथेंटिकेशन हैंडलिंग
      if (response && response.status === 401) {
        store.dispatch(logout());
        localStorage.clear();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

setupAuthInterceptors(JavaAPI);
setupAuthInterceptors(MongoAPI);