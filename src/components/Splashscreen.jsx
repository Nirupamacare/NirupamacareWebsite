import React, { useEffect, useState } from 'react';
import './Splashscreen.css';

const Splashscreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(onLoadingComplete, 500); // Small delay after 100%
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        {/* Logo and Branding */}
        <div className="logo-wrapper">
          <img 
            src="/logo-icon.png" 
            alt="Nirupama Care Logo" 
            className="brand-logo" 
          />
          <h1 className="brand-name">Nirupama care</h1>
        </div>

        {/* Tagline */}
        <div className="tagline-container">
          <p className="tagline-text">
            YOUR <span className="highlight">AI</span> HEALTHCARE GUIDE
          </p>
          <p className="tagline-text">IN YOUR LANGUAGE</p>
        </div>

        {/* Loading Section */}
        <div className="loader-section">
          <div className="loader-info">
            <span className="loader-status">
              <span className="spin-icon">🔄</span> Initializing AI engine...
            </span>
            <span className="loader-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="splash-footer">
        Version 1.0 • Secure Healthcare AI
      </footer>
    </div>
  );
};

export default Splashscreen;