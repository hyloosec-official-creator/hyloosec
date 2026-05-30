import axios from "axios";
import { store } from "../store/store";
import { logout } from "../Slice/authSlice";

const API_ENDPOINTS = {
  JAVA: {
    primary: "https://api.hyloosec.online/api", 
    secondary: "https://hyloosec-spring-backend-production.up.railway.app/api"
  },
  MONGO: {
    primary: "https://node.hyloosec.online/api",
    secondary: "https://hyloosec-node-backend-production.up.railway.app/api"
  }
};


export const MongoAPI = axios.create({ baseURL: API_ENDPOINTS.MONGO.primary, withCredentials: true });
export const JavaAPI = axios.create({ baseURL: API_ENDPOINTS.JAVA.primary, withCredentials: true });


const setupFailover = (instance, endpoints) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;

      if ((!response || response.status >= 500) && !config._isRetry) {
        config._isRetry = true;
        config.baseURL = endpoints.secondary; 
        console.warn("⚠️ Primary down, switching to Railway:", config.baseURL);
        return instance(config);
      }
      if (response && response.status === 401) {
        store.dispatch(logout());
        localStorage.clear();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

setupFailover(JavaAPI, API_ENDPOINTS.JAVA);
setupFailover(MongoAPI, API_ENDPOINTS.MONGO);