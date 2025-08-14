// React ve gerekli kütüphaneleri import ediyoruz
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// React uygulamasını root element'e bağla
const root = ReactDOM.createRoot(document.getElementById('root'));

// Uygulamayı render et
root.render(
  // Strict mode ile geliştirme modunda ekstra kontroller
  <React.StrictMode>
    {/* Ana uygulama bileşeni */}
    <App />
  </React.StrictMode>
);

reportWebVitals(); 