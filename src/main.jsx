import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import App from './App.jsx';

const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

if (isMaintenance) {
  createRoot(document.getElementById('root')).render(
    <div style={{
      display: "flex",  
      flexDirection: "column",
      justifyContent: "center",  
      alignItems: "center",   
    height: "100vh",          
    fontFamily: "sans-serif",
    color: "#9a9a9a",
    textAlign: "center"
}}>
    <h1>🛠️ Site Under Maintenance</h1>
    <p>We are currently optimizing our infrastructure. We'll be back soon!</p>
    <h4> Thank You </h4>
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