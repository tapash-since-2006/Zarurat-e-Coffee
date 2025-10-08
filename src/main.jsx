import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import './dashboard.css';
import './logDrinkModal.css';
import './viewHistoryModal.css';
import './login.css';
import './hero.css';
// import './fanta.css'



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
