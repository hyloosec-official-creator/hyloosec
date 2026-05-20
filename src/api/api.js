import axios from 'axios';
import { store } from '../store/store'; // Adjust path to your store.js
import { logout } from '../store/slices/authSlice'; // पाथ अपने रिड्यूसर के हिसाब से चेक कर लें

const API = axios.create({
  baseURL: 'https://HylooSec-node-backend.onrender.com/api', // Node Backend
  // अगर आप स्प्रिंग बूट सर्वर पर कॉल कर रहे हैं तो इसे उस हिसाब से रख सकते हैं
  withCredentials: true, // CRITICAL: यह ब्राउज़र को बैकग्राउंड में HttpOnly कुकीज़ ले जाने देता है
});

// 1. Request Interceptor: यह वैसे ही फेक टोकन हेडर में चिपकाता रहेगा ताकी हैकर कन्फ्यूज रहे
API.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token; // यह रिस्पॉन्स बॉडी वाला 128-bit फेक टोकन उठाएगा

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Response Interceptor (MANDATORY FOR AUTO-LOGOUT):
// यह सर्वर से आने वाले हर रिस्पॉन्स पर नज़र रखेगा। अगर बैकएंड ने 401 (Unauthorized) फेंका, 
// तो यह समझ जाएगा कि टोकन एक्सपायर या इनवैलिड है और तुरंत यूजर को लात मारकर बाहर कर देगा।
API.interceptors.response.use(
  (response) => response, // अगर रिस्पॉन्स सही है, तो चुपचाप आगे बढ़ा दो
  (error) => {
    // अगर सर्वर ने 401 भेजा (यानी टोकन एक्सपायर/इनवैलिड है)
    if (error.response && error.response.status === 401) {
      console.warn("Invalid or Expired Token detected! Logging out automatically...");
      
      // A. रेडक्स स्टेट साफ़ करें (Logout Action ट्रिगर करें)
      store.dispatch(logout()); 
      
      // B. लोकल स्टोरेज साफ़ करें ताकी पुरानी स्टेट बची न रहे
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");

      // C. पेज को रीलोड मारें ताकी यूजर तुरंत लॉगिन स्क्रीन पर रीडायरेक्ट हो जाए
      window.location.reload(); 
    }
    return Promise.reject(error);
  }
);

export default API;