import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Hero from './pages/Hero';
import { UseAuth } from './Context/AuthContext';

function PrivateRoute({ children }) {
  const { session, loading } = UseAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { session, loading } = UseAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route always shows Hero */}
        <Route path="/" element={<Hero />} />

        {/* Explicit hero route */}
        <Route path="/hero" element={<Hero />} />

        {/* Login route */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Private dashboard route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Catch all */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
