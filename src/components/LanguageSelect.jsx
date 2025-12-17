import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

import './LanguageSelect.css';

const LanguageSelect = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const navigate = useNavigate();

  const languages = [
    {
      id: 'bengali',
      title: 'Bengali (বাংলা)',
      description: 'Full interface in Bengali',
      icon: 'bn'
    },
    {
      id: 'english',
      title: 'English',
      description: 'Full interface in English',
      icon: 'en'
    },
    {
      id: 'banglish',
      title: 'English + Bengali (Banglish)',
      description: 'Mixed language support',
      icon: 'eb'
    }
  ];

  const handleContinue = () => {
    // Navigates to the Intro page
    if (selectedLanguage === 'english') {
      navigate('/intro');
    } else {
      // You can add logic for other languages here later
      console.log(`${selectedLanguage} selected`);
      navigate('/intro'); 
    }
  };

  return (
    <div className="page-container">
      <div className="language-card">
        {/* Logo/Icon Area */}
        <div className="icon-header">
          <div className="globe-icon">🌐</div>
        </div>

        <h2 className="title">Choose Your Language</h2>
        <p className="subtitle">
          Select the language you are most comfortable with. You can change this later from Settings.
        </p>

        <div className="language-list">
          {languages.map((lang) => (
            <div 
              key={lang.id}
              className={`language-option ${selectedLanguage === lang.id ? 'active' : ''}`}
              onClick={() => setSelectedLanguage(lang.id)}
            >
              <div className="radio-container">
                <div className={`radio-circle ${selectedLanguage === lang.id ? 'checked' : ''}`}>
                  {selectedLanguage === lang.id && <div className="radio-inner" />}
                </div>
              </div>
              <div className="text-content">
                <span className="lang-title">{lang.title}</span>
                <span className="lang-desc">{lang.description}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="continue-btn" onClick={handleContinue}>
          Continue
        </button>
      </div>
      
    </div>
  );
};

export default LanguageSelect;