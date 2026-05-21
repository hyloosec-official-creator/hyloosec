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

JavaAPI.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token; 

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log("cookie nahi milli aur logut");
        // store.dispatch(logout());
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
        // localStorage.removeItem("authToken");
        // window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

addResponseInterceptor(JavaAPI);
addResponseInterceptor(MongoAPI);