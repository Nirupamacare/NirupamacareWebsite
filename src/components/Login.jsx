import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = (e) => {
    e.preventDefault();
    if(agreed && phoneNumber.length >= 10) {
      navigate('/verify-otp');
      // Navigate to OTP verification page here
    }
  };

  return (
    <div className="login-container">
      {/* Left Branding Panel */}
      <div className="brand-panel">
        <div className="heart-overlay">
          <div className="brand-icon-wrapper">
             <img src="/blue-heart.png" alt="Icon" className="panel-logo-icon" />
          </div>
          <h1 className="panel-title">Nirupama Care</h1>
          <p className="panel-tagline">
            Your personal AI healthcare guide. Seamlessly connecting you to better health decisions.
          </p>
        </div>
        <footer className="panel-footer">© 2025 Nirupama Care</footer>
      </div>

      {/* Right Form Panel */}
      <div className="form-panel">
        <div className="form-wrapper">
          <div className="form-header">
            <img src="/logo-icon.png" alt="Nirupama care" className="form-logo" />
            <h2>Welcome Back</h2>
            <p>Please enter your details to continue</p>
          </div>

          <form onSubmit={handleSendOTP} className="login-form">
            <label className="input-label">Mobile Number</label>
            <div className="input-group">
              <span className="phone-icon">📱</span>
              <input 
                type="tel" 
                placeholder="Enter your Phone Number" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className={`send-otp-btn ${(!agreed || phoneNumber.length < 10) ? 'disabled' : ''}`}
              disabled={!agreed}
            >
              Send OTP
            </button>

            <div className="terms-checkbox">
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree to <a href="/terms">Terms & Privacy Policy</a>
              </label>
            </div>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="guest-action">
            <button className="guest-btn">
              Continue as guest <span>→</span>
            </button>
            <p className="limited-tag">(limited features)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;