import axios from "axios";
import { store } from "../store/store";
import { logout } from "../Slice/authSlice";

export const MongoAPI = axios.create({
  baseURL: "https://node.hyloosec.online/api",
  withCredentials: true,
});

export const JavaAPI = axios.create({
  baseURL: "https://api.hyloosec.online/api",
  withCredentials: true,
});

JavaAPI.interceptors.request.use(
  
  (config) => {
    console.log("📤 [API OUT]: Sending " + config.method.toUpperCase() + " to " + config.url);
    console.log("🔗 [API CREDENTIALS]: withCredentials = " + config.withCredentials);
    return config;
  },
  (error) => Promise.reject(error),
);

MongoAPI.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
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
    },
  );
};

addResponseInterceptor(JavaAPI);
addResponseInterceptor(MongoAPI);
