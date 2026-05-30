import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import App from './App.jsx';

// मेंटेनेंस मोड का वेरिएबल (या तो यहीं true/false करो या ENV यूज़ करो)
const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';; 

if (isMaintenance) {
  createRoot(document.getElementById('root')).render(
    <div style={{
    display: "flex",           // Flexbox ऑन किया
    flexDirection: "column",   // चीजों को ऊपर-नीचे रखा
    justifyContent: "center",  // वर्टिकली (ऊपर-नीचे) सेंटर
    alignItems: "center",      // हॉरिजॉन्टली (बाएं-दाएं) सेंटर
    height: "100vh",           // पूरी स्क्रीन की ऊंचाई
    fontFamily: "sans-serif",
    color: "#9a9a9a",
    textAlign: "center"
}}>
    <h1>🛠️ Site Under Maintenance</h1>
    <p>We are currently optimizing our infrastructure. We'll be back soon!</p>
</div>
  );
} else {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}