import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  const location = useLocation();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.hash === '#features') {
      // Wait a bit to ensure DOM is rendered
      setTimeout(() => {
        scrollToFeatures();
      }, 100);
    }
  }, [location]);

  return (
    <>
      <section className="hero-section">
        {/* New header with logo and site name */}
        <header className="hero-header">
          <div
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <img
              src="/logo5.jpg"
              alt="Zarurat-e-Coffee Logo"
              className="hero-logo"
            />
            <h1 className="hero-site-name">Zarurat-e-Coffee</h1>
          </div>
        </header>


        <div className="hero-background">
          <svg className="hero-svg" width="100%" height="100%">
            <defs>
              <radialGradient id="grad" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="#ffffff33" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" />
          </svg>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Track Your <span className="highlight">Caffeine Intake</span> with Precision
            </h1>
            <p>
              Easily log your drinks, monitor your caffeine levels in real time using scientific methods, and get clear insights on your consumption and spending habits.
            </p>
            <div className="hero-buttons">
              <Link to="/dashboard" className="btn secondary-btn">Dashboard</Link>
              <Link to="/login" className="btn secondary-btn">Sign In</Link>
              <Link to="/dashboard" className="btn primary-btn">Get Started</Link>

              <button
                type="button"
                className="btn secondary-btn"
                onClick={scrollToFeatures}
              >
                Know More
              </button>
            </div>
          </div>

          <div className="hero-image-container">
            <img src="/hero3.png" alt="Caffeine Tracker" className="hero-image" />
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2 className="features-title fancy-title">Why Choose This App?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Add Custom Drinks</h3>
            <p>Log any beverage with its caffeine content and cost — your personal caffeine diary.</p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Caffeine Tracking</h3>
            <p>Uses the scientific half-life method to calculate your current caffeine level accurately.</p>
          </div>
          <div className="feature-card">
            <h3>Detailed Consumption Stats</h3>
            <p>View daily and average caffeine intake, spending, and coffee consumption counts.</p>
          </div>
          <div className="feature-card">
            <h3>Top Drinks & Timing</h3>
            <p>See your three most consumed drinks and when you last enjoyed them.</p>
          </div>
          <div className="feature-card">
            <h3>Full History Access</h3>
            <p>Review your entire caffeine consumption history anytime, from day one to now.</p>
          </div>
          <div className="feature-card">
            <h3>Simple & Intuitive</h3>
            <p>Log drinks effortlessly with a clean and user-friendly interface.</p>
          </div>
        </div>
      </section>

      <section className="knowledge-section">
        <h2 className="knowledge-title fancy-title">What You’ll Learn</h2>
        <ul className="knowledge-list">
          <li>How caffeine decreases in your body over time using half-life science.</li>
          <li>How to track and manage your caffeine intake effectively.</li>
          <li>Insights on spending and consumption trends to optimize your habits.</li>
          <li>How to use data to make smarter caffeine choices without guesswork.</li>
        </ul>
      </section>
    </>
  );
}
