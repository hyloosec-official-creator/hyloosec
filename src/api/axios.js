import axios from "axios";

const API = axios.create({
  baseURL: "https://hyloosec-spring-backend.onrender.com",
});

export default API;