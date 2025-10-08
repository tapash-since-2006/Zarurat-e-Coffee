import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/dashboard.css';
import './design/logDrinkModal.css';
import './design/viewHistoryModal.css';
import './design/login.css';
import './design/hero.css';




import App from './App.jsx';
import { ModalProvider } from './Context/ModalContext';  // adjust path if needed
import { AuthProvider } from './Context/AuthContext';    // adjust path to your AuthContext

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </StrictMode>,
);
