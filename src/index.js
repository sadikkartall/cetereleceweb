// React ve gerekli kütüphaneleri import ediyoruz
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';

// React uygulamasını root element'e bağla
const root = ReactDOM.createRoot(document.getElementById('root'));

// Uygulamayı render et
root.render(
  // Strict mode ile geliştirme modunda ekstra kontroller
  <React.StrictMode>
    {/* Sayfa yönlendirmesi için router */}
    <BrowserRouter>
      {/* CSS sıfırlama */}
      <CssBaseline />
      {/* Ana uygulama bileşeni */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 