import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLogin) {
      console.log('Login logic:', { 
        identifier: formData.identifier, 
        password: formData.password 
      });

      // 1. Simulate Token
      const fakeToken = "user_token_12345"; 
      localStorage.setItem('token', fakeToken);

      // 2. Navigate to Home
      navigate('/home'); 

    } else {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      console.log('Signup logic:', formData);
      navigate('/userprofilesetup');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      fullName: '',
      identifier: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    // UNIQUE ID WRAPPER FOR ISOLATION
    <div id="auth-page-root">
      
      {/* --- Navbar Section (Scoped) --- */}
      <nav className="auth-navbar">
        <div className="auth-nav-container">
          <div className="auth-logo">
             <img src="nirupama1.png" className="auth-logo-icon" alt="Logo" />   
          </div>
          
          <div className="auth-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
          </div>

          <ul className={isMenuOpen ? "auth-nav-links active" : "auth-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Auth Form Section --- */}
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-sub-text">
              {isLogin 
                ? 'Please login to access your health dashboard' 
                : 'Join us to manage your health journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-input-group fade-in">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="identifier">Mobile Number or Email</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="e.g. 9876543210 or user@email.com"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="auth-input-group fade-in">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            {isLogin && (
              <div className="auth-actions">
                <div className="auth-remember">
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="/forgot-password" className="auth-forgot">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className="auth-btn-primary">
              {isLogin ? 'Login' : 'Register'}
            </button>

            {isLogin && (
              <>
                <div className="auth-divider">
                  <span>OR</span>
                </div>
                <button type="button" className="auth-btn-secondary">
                  Login with OTP
                </button>
              </>
            )}
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={toggleAuthMode} className="auth-toggle-link">
                {isLogin ? 'Register Now' : 'Login Here'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;