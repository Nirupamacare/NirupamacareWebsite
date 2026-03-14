import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <div className="not-found-icon">🏥</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-msg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <button className="not-found-btn primary" onClick={() => navigate('/home')}>
            Go to Home
          </button>
          <button className="not-found-btn secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
