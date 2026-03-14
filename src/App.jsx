import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { ToastProvider } from "./context/ToastContext";
// import LanguageSelect from "./components/LanguageSelect";
import Splashscreen from "./components/Splashscreen";
import Intro from "./components/Intro";
import HelpCenter from "./components/internalcomponents/HelpCenter";
import Home from "./components/Home";
import UserProfileSetup from "./components/Userprofilesetup";
import Login from "./components/Login";
import About from "./components/About";
import Security from "./components/Security";
import Otp from "./components/Otp";
import Doctors from "./components/Doctors";
import DoctorProfileView from './components/DoctorProfileView';
import DoctorProfileSetup from './components/DoctorProfileSetup';
import DoctorAuth from './components/DoctorAuth';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorProfileEdit from './components/DoctorProfileEdit';
import UserProfileView from "./components/UserProfileView";
import AppointmentBooking from "./components/AppointmentBooking";
import MyAppointments from "./components/MyAppointments";
import MedicalRecords from "./components/MedicalRecords";
import AdminPanel from "./components/AdminPanel";
import DoctorVideoCall from "./components/DoctorVideoCall";
import VideoCallRoom from "./components/VideoCallRoom";
import PatientVideoCall from "./components/PatientVideoCall";
import LabDashboard from "./components/LabDashboard";
import LabSignup from "./components/LabSignup";
import BookLab from "./components/LabBooking";
import NotFound from "./components/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import "./App.css";

// =========================================
// Protected Route — redirects if not authed
// =========================================
const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const [status, setStatus] = useState("loading"); // "loading" | "authed" | "unauthed"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setStatus(user ? "authed" : "unauthed");
    });
    return () => unsub();
  }, []);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1rem", color: "#6b7280"
      }}>
        Checking authentication...
      </div>
    );
  }

  return status === "authed" ? children : <Navigate to={redirectTo} replace />;
};

const SplashWrapper = () => {
  const navigate = useNavigate();
  return <Splashscreen onLoadingComplete={() => navigate("/home")} />;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="app-container">

          {/* MAIN CONTENT */}
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SplashWrapper />} />
              {/* <Route path="/language" element={<LanguageSelect />} /> */}
              <Route path="/home" element={<Home />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctor-profile/:doctorId" element={<DoctorProfileView />} />
              <Route path="/intro" element={<Intro />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/doctor-login" element={<DoctorAuth />} />
              <Route path="/lab/signup" element={<LabSignup />} />

              {/* Patient Protected Routes */}
              <Route path="/book-appointment/:doctorId" element={
                <ProtectedRoute redirectTo="/login">
                  <AppointmentBooking />
                </ProtectedRoute>
              } />
              <Route path="/my-appointments" element={
                <ProtectedRoute redirectTo="/login">
                  <MyAppointments />
                </ProtectedRoute>
              } />
              <Route path="/medical-records" element={
                <ProtectedRoute redirectTo="/login">
                  <MedicalRecords />
                </ProtectedRoute>
              } />
              <Route path="/userprofilesetup" element={
                <ProtectedRoute redirectTo="/login">
                  <UserProfileSetup />
                </ProtectedRoute>
              } />
              <Route path="/view-profile" element={
                <ProtectedRoute redirectTo="/login">
                  <UserProfileView />
                </ProtectedRoute>
              } />
              <Route path="/security" element={
                <ProtectedRoute redirectTo="/login">
                  <Security />
                </ProtectedRoute>
              } />
              <Route path="/verify-otp" element={
                <ProtectedRoute redirectTo="/login">
                  <Otp />
                </ProtectedRoute>
              } />
              <Route path="/request-call/:doctorId" element={
                <ProtectedRoute redirectTo="/login">
                  <PatientVideoCall />
                </ProtectedRoute>
              } />
              <Route path="/video-call/:callId" element={
                <ProtectedRoute redirectTo="/login">
                  <VideoCallRoom userType="patient" />
                </ProtectedRoute>
              } />
              <Route path="/video-call" element={
                <ProtectedRoute redirectTo="/login">
                  <VideoCallRoom />
                </ProtectedRoute>
              } />
              <Route path="/lab-book" element={
                <ProtectedRoute redirectTo="/login">
                  <BookLab />
                </ProtectedRoute>
              } />

              {/* Doctor Protected Routes */}
              <Route path="/doctor-dashboard" element={
                <ProtectedRoute redirectTo="/doctor-login">
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor-setup" element={
                <ProtectedRoute redirectTo="/doctor-login">
                  <DoctorProfileSetup />
                </ProtectedRoute>
              } />
              <Route path="/doctor-edit" element={
                <ProtectedRoute redirectTo="/doctor-login">
                  <DoctorProfileEdit />
                </ProtectedRoute>
              } />
              <Route path="/doctor-video-calls" element={
                <ProtectedRoute redirectTo="/doctor-login">
                  <DoctorVideoCall />
                </ProtectedRoute>
              } />
              <Route path="/doctor/video-call/:callId" element={
                <ProtectedRoute redirectTo="/doctor-login">
                  <VideoCallRoom userType="doctor" />
                </ProtectedRoute>
              } />

              {/* Lab Protected Routes */}
              <Route path="/lab/dashboard" element={
                <ProtectedRoute redirectTo="/lab/signup">
                  <LabDashboard />
                </ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={<AdminPanel />} />

              {/* Privacy Policy */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              {/* Terms and Conditions */}
              <Route path="/terms" element={<TermsAndConditions />} />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* GLOBAL FAT FOOTER */}
          <footer className="fat-footer">
            <div className="fat-footer-container">

              <div className="fat-footer-grid">
                {/* Brand Column */}
                <div className="fat-footer-col brand-col">
                  <div className="fat-footer-brand">
                    <img src="/nirupama1.png" alt="Nirupama Care" className="fat-footer-logo" />
                  </div>
                  <p className="fat-footer-desc">
                    Bridging the gap between patients and world-class healthcare with trusted, secure, and accessible digital consultations.
                  </p>
                </div>

                {/* Patients Column */}
                <div className="fat-footer-col">
                  <h4>For Patients</h4>
                  <ul>
                    <li><a href="/doctors">Find a Doctor</a></li>
                    <li><a href="/video-consult">Video Consult</a></li>
                    <li><a href="/lab-booking">Book Lab Test</a></li>
                    <li><a href="/my-appointments">My Appointments</a></li>
                    <li><a href="/medical-records">Medical Records</a></li>
                  </ul>
                </div>

                {/* Providers Column */}
                <div className="fat-footer-col">
                  <h4>For Providers</h4>
                  <ul>
                    <li><a href="/doctor-login">Doctor Login</a></li>
                    <li><a href="/lab/signup">Join as Lab Partner</a></li>
                  </ul>
                </div>

                {/* Legal Column */}
                <div className="fat-footer-col">
                  <h4>Company</h4>
                  <ul>
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms & Conditions</a></li>
                    <li><a href="/security">Security & Privacy</a></li>
                    <li><a href="/help">Help Center</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom Copyright Row */}
              <div className="fat-footer-bottom">
                <p>&copy; {new Date().getFullYear()} Nirupama Care. All rights reserved.</p>
                <div className="fat-footer-social">
                  <a href="#">Twitter</a>
                  <a href="https://in.linkedin.com/company/nirupamacare">LinkedIn</a>
                  <a href="#">Facebook</a>
                </div>
              </div>

            </div>
          </footer>

        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
