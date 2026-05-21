import axios from "axios";
import { store } from "../store/store"; 
import { logout } from "../Slice/authSlice"; 

export const MongoAPI = axios.create({
  baseURL: "https://hyloosec-node-backend.onrender.com/api",
  withCredentials: true,
});

export const JavaAPI = axios.create({
  baseURL: "https://hyloosec-spring-backend.onrender.com/api",
  withCredentials: true,
});

// 🎯 यहाँ का हेडर ब्लॉक हमने हटा दिया है।
// अब ब्राउज़र ऑटोमैटिक HttpOnly कुकी भेजेगा, हेडर की कोई जरूरत नहीं!
JavaAPI.interceptors.request.use(
  (config) => {
    return config; 
  },
  (error) => Promise.reject(error)
);

MongoAPI.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

const addResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        console.log("Session expired - logging out");
        store.dispatch(logout());
        localStorage.clear();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

addResponseInterceptor(JavaAPI);
addResponseInterceptor(MongoAPI);