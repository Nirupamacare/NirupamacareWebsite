import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import './Splashscreen.css';

const Splashscreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate(); // 2. Initialize the hook

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          
          // 3. Navigate after the small 500ms delay
          setTimeout(() => {
            if (onLoadingComplete) onLoadingComplete(); // Call prop if provided (optional)
            navigate('/language-select');
          }, 500);
          
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [navigate, onLoadingComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        {/* Logo and Branding */}
        <div className="logo-wrapper">
          <img 
            src="/logo-lightblue1.png" 
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