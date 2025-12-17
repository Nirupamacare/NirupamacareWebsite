import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

import './Intro.css';

const Intro = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();


  const onboardingData = [
    {
      title: "Tell us your symptoms. We understand Bengali & English.",
      subtitle: "Just tell us what's bothering you. We'll handle the rest.",
      image: "/doctor-3d.png", // Replace with your actual image path
      id: 1
    },
    {
      title: "Offline + online in one app",
      subtitle: "Visit nearby clinics or talk to doctors online from the comfort of your home. Your health journey, simplified.",
      image: "/stethoscope-3d.png", // Replace with your actual image path
      id: 2
    },
    {
      title: "Book doctor visits, online calls, or lab tests in one app.",
      subtitle: "Book lab tests and get timely reminders on your phone. Healthcare management made simple for everyone.",
      image: "/calendar-3d.png", // Replace with your actual image path
      id: 3
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to Login/Signup
      window.location.href = "/login"; 
    }
  };

  const handleSkip = () => {
  navigate("/login");
};


  return (
    <div className="intro-container">
      {/* Top Navigation Bar */}
      <nav className="intro-nav">
        <div className="nav-logo">
          <img src="/logo-icon.png" alt="Nirupama Care" className="mini-logo" />
          <span>Nirupama care</span>
        </div>
        <div className="nav-links">
          <span className="help-link" onClick={() => navigate('/help')}>Help Center</span>
          <button className="skip-btn-text" onClick={handleSkip}>Skip</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="intro-content">
        <div className={`intro-grid ${currentStep % 2 === 0 ? '' : 'reverse'}`}>
          
          <div className="text-section">
            <h1 className="intro-title">{onboardingData[currentStep].title}</h1>
            <p className="intro-subtitle">{onboardingData[currentStep].subtitle}</p>
            
            <div className="action-buttons">
              <button className="get-started-btn" onClick={handleNext}>
                {currentStep === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </button>
              <button className="skip-inline-btn" onClick={handleSkip}>Skip</button>
            </div>

            {/* Pagination Dots */}
            <div className="pagination-dots">
              {onboardingData.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${currentStep === index ? 'active' : ''}`}
                  onClick={() => setCurrentStep(index)}
                ></span>
              ))}
            </div>
          </div>

          <div className="image-section">
            <div className="image-card">
              <img 
                src={onboardingData[currentStep].image} 
                alt="feature illustration" 
                className="feature-img" 
              />
              {currentStep === 2 && (
                <div className="floating-badge">
                  <div className="check-icon">✓</div>
                  <div>
                    <p className="badge-status">CONFIRMED</p>
                    <p className="badge-name">Dr. Sarah Johnson</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Intro;