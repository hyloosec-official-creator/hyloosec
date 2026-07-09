import axios from "axios";
import { store } from "../store/store";
import { logout, setSessionExpired } from "../Slice/authSlice";

const USE_LOCAL_SERVER = false;

const API_ENDPOINTS = {
  JAVA: USE_LOCAL_SERVER
    ? "http://localhost:8082/api"
    : import.meta.env.VITE_JAVA_API_URL,
  MONGO: USE_LOCAL_SERVER
    ? "http://localhost:5000/api"
    : import.meta.env.VITE_MONGO_API_URL,
};
// --- UPDATE END ---

export const MongoAPI = axios.create({
  baseURL: API_ENDPOINTS.MONGO,
  withCredentials: true,
});

export const JavaAPI = axios.create({
  baseURL: API_ENDPOINTS.JAVA,
  withCredentials: true,
});

const setupAuthInterceptors = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response } = error;

      if (response) {
        if (response.status === 401 || response.status === 403) {
          store.dispatch(setSessionExpired(true));
        }
      }
      return Promise.reject(error);
    },
  );
};

setupAuthInterceptors(JavaAPI);
setupAuthInterceptors(MongoAPI);
