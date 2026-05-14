import axios from "axios";

const API = axios.create({
  baseURL: "https://HylooSec-spring-backend.onrender.com",
});

export default API;