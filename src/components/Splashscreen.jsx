import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splashscreen.css'; 
// import logo from './assets/nirupama-logo.png'; 

const Splashscreen = () => {
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      
      // Wait for fade out animation (0.8s) then navigate
      setTimeout(() => {
        navigate('/language'); 
      }, 800); 

    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`splash-container ${isFading ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img 
           src="nirupama.png" 
           alt="Nirupama Care" 
           className="splash-logo" 
        />
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
        <p className="splash-tagline">Affordable healthcare at your fingertips</p>
      </div>
    </div>
  );
};

export default Splashscreen;