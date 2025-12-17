import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Otp.css';

const Otp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(40);
  const navigate = useNavigate();

  // Handle Countdown Timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle individual digit input
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Auto-focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length === 4) {
      console.log("Verifying OTP:", code);
      // Logic for verification and navigation to Dashboard or Registration
      navigate('/register'); 
    }
  };

  return (
    <div className="otp-container">
      {/* Left Branding Panel: Secure Access */}
      <div className="otp-brand-panel">
        <div className="security-content">
          <div className="lock-icon-wrapper">
             <span className="lock-icon">🔒</span>
          </div>
          <h1 className="secure-title">Secure Access to Personalized Care.</h1>
          <p className="secure-text">
            Your health journey is important to us. Verify your identity to seamlessly access your Nirupama Care dashboard and AI insights.
          </p>
          <div className="security-badges">
            <span className="badge">🛡️ Bank-grade Security</span>
            <span className="badge">⚡ Instant Verification</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel: OTP Input */}
      <div className="otp-form-panel">
        <div className="otp-form-wrapper">
          <div className="otp-header">
            <div className="logo-section">
               <img src="/logo-icon.png" alt="logo" className="small-logo" />
               <span className="brand-text">Nirupama care</span>
            </div>
            <h2>Verify OTP</h2>
            <p>Enter the code sent to your registered number <strong>*** *** 408</strong></p>
          </div>

          <div className="otp-input-group">
            {otp.map((data, index) => (
              <input
                className="otp-field"
                type="text"
                name="otp"
                maxLength="1"
                key={index}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onFocus={e => e.target.select()}
              />
            ))}
          </div>

          <div className="otp-actions">
            <div className="timer-section">
              <span className="clock-icon">🕒</span>
              <span>00:{timer < 10 ? `0${timer}` : timer}</span>
            </div>
            <button className="resend-btn" onClick={() => setTimer(40)} disabled={timer > 0}>
              Resend Code
            </button>
          </div>

          <button 
            className={`verify-btn ${otp.join("").length < 4 ? 'disabled' : ''}`}
            onClick={handleVerify}
            disabled={otp.join("").length < 4}
          >
            Verify & Proceed →
          </button>

          <p className="trouble-text">
            Having trouble? <a href="/help">Contact Support</a>
          </p>
          
          <div className="otp-bottom-links">
            <span>© 2025 Nirupama Care</span>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Otp;