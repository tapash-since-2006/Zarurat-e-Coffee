import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UseAuth } from '../Context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { signUpUser, signInUser, session } = UseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set isSignUp based on query param on mount
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [location.search]);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleAuth = async () => {
    setLoading(true);
    let result;

    if (isSignUp) {
      result = await signUpUser(email, password);
    } else {
      result = await signInUser(email, password);
    }

    setLoading(false);

    if (result.error) {
      alert(`Error: ${result.error.message || result.error}`);
    } else {
      setEmail('');
      setPassword('');
      if (isSignUp) {
        setIsSignUp(false);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="lp-container">
      <div
        className="lp-header"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img src="/logo5.jpg" alt="Brand Logo" className="lp-logo" />
        <h1 className="lp-brandName">Zarurat-e-Coffee</h1>
      </div>

      <div className="lp-card">
        <h2 className="lp-title">{isSignUp ? 'Create Your Account' : 'Welcome Back'}</h2>
        <p className="lp-subtitle">{isSignUp ? 'Sign up to get started' : 'Log in to your account'}</p>

        <input
          className="lp-input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          className="lp-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          className="lp-btn"
          onClick={handleAuth}
          disabled={loading || !email || !password}
        >
          {loading
            ? isSignUp
              ? 'Signing Up...'
              : 'Signing In...'
            : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
        </button>

        <div
          className="lp-toggleText"
          onClick={() => !loading && setIsSignUp(!isSignUp)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsSignUp(!isSignUp);
          }}
        >
          {isSignUp
            ? 'Already have an account? Log In'
            : "Don't have an account? Create one"}
        </div>

        {/* Links for navigation */}
        <div className="lp-links">
          <Link to="/" className="lp-btn-link">
            Back to Home
          </Link>
          <Link to="/#features" className="lp-btn-link">
            Know More
          </Link>
        </div>
      </div>
    </div>
  );
}
