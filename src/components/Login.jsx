import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth"; 
import { auth, googleProvider } from "../firebase"; 
import { api } from "../api"; 
import './Login.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SHARED HELPER: Send Token to Backend ---
  const handleBackendSync = async (user) => {
    try {
      const token = await user.getIdToken();
      
      // Call our updated API
      const response = await api.authenticate(token, formData);
      
      console.log("✅ Backend Sync Success:", response);
      
      // Save the token so Home.jsx knows we are logged in
      localStorage.setItem('token', token); 
      
      // Save User Details
      localStorage.setItem('mongo_user_id', response.account.id);
      localStorage.setItem('user_role', response.account.role);
      
      // Save name for greeting (optimistic update)
      if (formData.fullName) {
          localStorage.setItem('user_name', formData.fullName.split(' ')[0]);
      } else if (user.displayName) {
          localStorage.setItem('user_name', user.displayName.split(' ')[0]);
      }
      
      // ❌ REMOVED ALERT
      // alert(`Welcome, ${response.account.email}!`);
      
      // 🚀 Send everyone to Home first.
      // Home.jsx will check if they have a profile. 
      // If NOT, Home.jsx will automatically redirect them to /userprofilesetup.
      navigate('/home'); 

    } catch (err) {
      console.error("Backend Sync Failed:", err);
      setError("Connected to Google, but Backend failed. Check console.");
    }
  };

  // --- 1. GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleBackendSync(result.user);
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EMAIL/PASSWORD LOGIN & REGISTER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = formData.identifier; 
    const password = formData.password;

    try {
      let userCredential;

      if (isLogin) {
        // Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register
        if (password !== formData.confirmPassword) {
          setError("Passwords do not match!");
          setLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      // Sync with Backend
      await handleBackendSync(userCredential.user);

    } catch (err) {
      console.error("Auth Error:", err);
      if (err.code === "auth/invalid-email") setError("Invalid email address.");
      else if (err.code === "auth/user-not-found") setError("Account not found.");
      else if (err.code === "auth/wrong-password") setError("Incorrect password.");
      else if (err.code === "auth/email-already-in-use") setError("Email already used.");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ fullName: '', identifier: '', password: '', confirmPassword: '' });
  };

  return (
    <div id="auth-page-root">
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
          </ul>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-sub-text">
              {isLogin ? 'Login to your dashboard' : 'Join us to manage your health'}
            </p>
          </div>

          {error && <div style={{color: '#d32f2f', textAlign: 'center', marginBottom: '10px'}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-input-group fade-in">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="auth-input-group">
              <label>Email Address</label>
              <input
                type="email"
                name="identifier"
                placeholder="user@example.com"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="auth-input-group fade-in">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>
            
            <button 
                type="button" 
                className="auth-btn-secondary"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{ marginBottom: '10px', backgroundColor: '#db4437', color: 'white', borderColor: '#db4437' }}
            >
              {loading ? 'Processing...' : 'Sign in with Google'}
            </button>
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