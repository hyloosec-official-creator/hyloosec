import axios from "axios";

// 1. Axios Instance क्रिएट करें
const API = axios.create({
  baseURL: "https://HylooSec-spring-backend.onrender.com",
});

// 2. Request Interceptor जोड़ें
// यह हर API कॉल से पहले अपने आप बैकएंड के लिए टोकन चिपका देगा
API.interceptors.request.use(
  (config) => {
    // LocalStorage से टोकन निकालें
    const token = localStorage.getItem("token");
    
    // अगर टोकन मौजूद है, तो उसे Authorization हेडर में सेट करें
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (वैकल्पिक लेकिन उपयोगी)
// अगर कभी टोकन एक्सपायर हो जाए (401/403 एरर आए), तो यूजर को अपने आप लॉगआउट करने के लिए
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Token expired or invalid, logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload(); // पेज रीलोड होकर यूजर को लॉगिन स्क्रीन पर ले जाएगा
    }
    return Promise.reject(error);
  }
);

export default API;