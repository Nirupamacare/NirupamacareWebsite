import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, Users, Video, MapPin,
  CheckCircle, XCircle, Plus, Trash2, LogOut,
  Mic, MicOff, VideoOff, PhoneOff, BarChart3, Upload
} from 'lucide-react';
import RevenueAnalytics from './RevenueAnalytics';
import AttachmentUploadModal from './AttachmentUploadModal';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Calendar from 'react-calendar'; // Import Calendar
import 'react-calendar/dist/Calendar.css'; // Import Calendar CSS
import { api } from '../api';
import { auth } from '../firebase';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(true);

  const [pendingCalls, setPendingCalls] = useState([]);


  // Dropdown Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Data States
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]); // State for blocked dates

  // Video Call State
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAppointmentForUpload, setSelectedAppointmentForUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });

  // Form State (Aligned with Backend naming: snake_case)
  const [newSlot, setNewSlot] = useState({ day: 'Monday', start_time: '', end_time: '' });

  // Quick Schedule Generator State
  const [dailyConfig, setDailyConfig] = useState({ start: '09:00', end: '17:00' });
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [undoStack, setUndoStack] = useState(null); // To store previous slots for Undo logic

  const handleToggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleApplyDailySchedule = async () => {
    if (!dailyConfig.start || !dailyConfig.end) return;

    // Validation: Start Time must be before End Time
    if (dailyConfig.start >= dailyConfig.end) {
      alert("Start Time must be strictly earlier than End Time (e.g., 09:00 to 17:00).");
      return;
    }

    // Save current state to Undo Stack before changing
    setUndoStack([...mySlots]);

    // Create new slots with temp unique integer IDs
    const baseId = Date.now();
    const newSlots = selectedDays.map((day, index) => ({
      day,
      start_time: dailyConfig.start,
      end_time: dailyConfig.end,
      id: baseId + index + Math.floor(Math.random() * 1000) // Ensure integer
    }));

    const updatedSlots = [...mySlots, ...newSlots];
    setMySlots(updatedSlots);

    try {
      await api.updateAvailability(updatedSlots);
    } catch (error) {
      console.error("Failed to save daily schedule", error);
      alert("Failed to save schedule");
      setMySlots(mySlots); // Revert
      setUndoStack(null);
    }
  };

  const handleUndo = async () => {
    if (!undoStack) return;
    const currentSlots = [...mySlots];
    setMySlots(undoStack); // Optimistic Revert

    try {
      await api.updateAvailability(undoStack);
      setUndoStack(null); // Clear undo availability
    } catch (err) {
      alert("Failed to undo.");
      setMySlots(currentSlots);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Load Data ---
  useEffect(() => {
    // Wait for Firebase to restore authentication state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // User is not authenticated
        console.error("User not authenticated, redirecting to login");
        navigate('/doctor-login');
        return;
      }

      // User is authenticated, proceed to fetch data
      try {
        setLoading(true);

        // 1. Fetch Data in Parallel
        const [profileData, appointmentsData, availabilityData] = await Promise.all([
          api.getDoctorProfile().catch((err) => {
            console.error("Profile fetch error:", err);
            return null;
          }),
          api.getDoctorAppointments().catch((err) => {
            console.error("Appointments fetch error:", err);
            return [];
          }),
          api.getDoctorAvailability().catch((err) => {
            console.error("Availability fetch error:", err);
            return [];
          })
        ]);

        if (profileData) {
          setDoctorProfile(profileData);
          setBlockedDates(profileData.blocked_dates || []);
        }
        setAppointments(appointmentsData || []);

        // Backend returns snake_case, so we use it directly here
        setMySlots(availabilityData || []);

        // 2. Calculate Stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = (appointmentsData || []).filter(a => a.date === todayStr).length;
        const pendingCount = (appointmentsData || []).filter(a => a.status === 'Pending').length;

        setStats({
          total: (appointmentsData || []).length,
          today: todayCount,
          pending: pendingCount
        });

        const calls = await api.getDoctorPendingCalls();
    setPendingCalls(calls.filter(c => c.status === 'requested'))

      } catch (err) {
        console.error("Failed to load dashboard data", err);
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          navigate('/doctor-login');
        }
      } finally {
        setLoading(false);
      }
    });

    

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);


  useEffect(()=>{
    const callsInterval = setInterval(async () => {
    const calls = await api.getDoctorPendingCalls();
    setPendingCalls(calls.filter(c => c.status === 'requested'));
  }, 10000);
  
  return () => clearInterval(callsInterval);
  },[])
  // --- Handlers ---
  const handleLogout = async () => {
    await api.logout();
    navigate('/doctor-login'); // Make sure this matches your Route path
  };

  const handleStatusUpdate = async (aptId, newStatus) => {
    // If marking as completed, open upload modal instead of direct API call
    if (newStatus === 'Completed') {
      const apt = appointments.find(a => a.id === aptId);
      handleOpenUploadModal(apt);
      return;
    }

    // Optimistic update
    const previous = [...appointments];
    setAppointments(appointments.map(a =>
      (a.id === aptId) ? { ...a, status: newStatus } : a
    ));

    try {
      await api.updateAppointmentStatus(aptId, newStatus);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update status");
      setAppointments(previous); // Revert
    }
  };

  const handleOpenUploadModal = (apt) => {
    setSelectedAppointmentForUpload(apt);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (attachments) => {
    if (!selectedAppointmentForUpload) return;

    setIsUploading(true);
    try {
      // API call to update status to "Completed" AND upload attachments
      await api.updateAppointmentStatus(selectedAppointmentForUpload.id, "Completed", attachments);

      // Update UI
      setAppointments(appointments.map(a =>
        (a.id === selectedAppointmentForUpload.id) ? { ...a, status: 'Completed', attachments: attachments } : a
      ));

      setShowUploadModal(false);
      setSelectedAppointmentForUpload(null);
    } catch (error) {
      console.error("Failed to complete appointment", error);
      alert("Failed to upload documents. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const addSlot = async () => {
    // Check using snake_case keys
    if (newSlot.start_time && newSlot.end_time) {

      // Create new list including the new slot
      // Note: MongoDB might assign an ID later, but for UI we add a temp ID
      const slotToAdd = { ...newSlot, id: Date.now() };
      const updatedSlots = [...mySlots, slotToAdd];

      // Optimistic UI Update
      setMySlots(updatedSlots);

      try {
        // Send to backend (It expects list of objects with snake_case)
        await api.updateAvailability(updatedSlots);
        setNewSlot({ ...newSlot, start_time: '', end_time: '' }); // Reset Form
      } catch (error) {
        alert("Failed to save slot.");
        setMySlots(mySlots); // Revert on error
      }
    } else {
      alert("Please select start and end times");
    }
  };

  const removeSlot = async (idOrIndex) => {
    // MongoDB might not have unique IDs for embedded slots immediately accessible
    // If your backend returns IDs, use IDs. If not, use index carefully.
    // For now, filtering by the specific object properties or ID if available.
    const updatedSlots = mySlots.filter(s => s.id !== idOrIndex);
    setMySlots(updatedSlots);
    try {
      await api.updateAvailability(updatedSlots);
    } catch (error) {
      alert("Failed to remove slot.");
      setMySlots(mySlots);
    }
  };

  const startVideoCall = (apt) => {
    setActiveVideoCall(apt);
    setActiveTab('video');
  };

  const endVideoCall = () => {
    setActiveVideoCall(null);
    // Stay on video tab (Lobby) is usually better UX
  };

  // --- Calendar Handlers ---
  const handleDateClick = async (value) => {
    // value is a Date object. Convert to YYYY-MM-DD in local time
    // Use this trick to get YYYY-MM-DD correctly for local time
    const offset = value.getTimezoneOffset();
    const date = new Date(value.getTime() - (offset * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];

    // Check if already blocked
    const isBlocked = blockedDates.includes(dateStr);

    // Optimistic Update
    const prevBlocked = [...blockedDates];
    if (isBlocked) {
      setBlockedDates(prevBlocked.filter(d => d !== dateStr));
    } else {
      setBlockedDates([...prevBlocked, dateStr]);
    }

    try {
      if (isBlocked) {
        // Unblock
        await api.unblockDate(dateStr);
      } else {
        // Block
        await api.blockDate(dateStr);
      }
    } catch (error) {
      console.error("Failed to update blocked date", error);
      const msg = error.response?.data?.detail || "Failed to update availability. backend server might be down.";
      alert(msg);
      setBlockedDates(prevBlocked); // Revert
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const offset = date.getTimezoneOffset();
      const d = new Date(date.getTime() - (offset * 60 * 1000));
      const dateStr = d.toISOString().split('T')[0];

      if (blockedDates.includes(dateStr)) {
        return 'blocked-date';
      }
    }
    return null;
  };

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div id="dashboard-root">
      <nav className="dash-navbar">
        <div className="dash-nav-left">
          <img src="/nirupama1.png" alt="Logo" className="dash-logo" />
          <span className="badge-pro">Doctor Portal</span>
        </div>
        <div className="dash-nav-right" ref={profileMenuRef}>
          <div
            className={`dash-profile-widget ${showProfileMenu ? 'active' : ''}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="dash-profile-text">
              <span className="dash-greeting">Welcome,</span>
              <span className="dash-username">{doctorProfile?.first_name || doctorProfile?.display_name?.split(' ')[0] || 'Doctor'}</span>
            </div>
            <div className="dash-avatar">
              {(doctorProfile?.profile_picture || doctorProfile?.profile_image_url) ? (
                <img src={doctorProfile.profile_picture || doctorProfile.profile_image_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                doctorProfile?.first_name ? doctorProfile.first_name[0] : (doctorProfile?.display_name ? doctorProfile.display_name[0] : 'D')
              )}
            </div>
          </div>

          {showProfileMenu && (
            <div className="dash-dropdown-menu fade-in-fast">
              <div className="dropdown-item" onClick={() => navigate('/doctor-edit')}>
                <span>👤</span> View My Profile
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="dash-container">

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="sidebar-profile">
            <div className="avatar-circle" onClick={() => navigate('/doctor-edit')} style={{ cursor: 'pointer', position: 'relative' }}>
              {(doctorProfile?.profile_picture || doctorProfile?.profile_image_url) ? (
                <img src={doctorProfile.profile_picture || doctorProfile.profile_image_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                doctorProfile?.display_name ? doctorProfile.display_name[0] : 'D'
              )}
              {/* Optional: Add a small edit icon overlay */}
              <div style={{
                position: 'absolute', bottom: '0', right: '0',
                background: '#007bff', color: 'white', borderRadius: '50%',
                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', border: '2px solid white'
              }}>
                ✎
              </div>
            </div>
            <h3 onClick={() => navigate('/doctor-edit')} style={{ cursor: 'pointer' }}>{doctorProfile?.display_name || "Doctor"}</h3>
            <p>{doctorProfile?.specialty || "Specialist"}</p>
          </div>

          <nav className="sidebar-menu">
            <button
              className={activeTab === 'appointments' ? 'active' : ''}
              onClick={() => setActiveTab('appointments')}
            >
              <CalendarIcon size={20} /> Appointments
            </button>
            <button
              className={activeTab === 'schedule' ? 'active' : ''}
              onClick={() => setActiveTab('schedule')}
            >
              <Clock size={20} /> Manage Schedule
            </button>
            <button
              className={activeTab === 'video' ? 'active' : ''}
              onClick={() => navigate('/doctor-video-calls')}
              style={{ position: 'relative' }}
            >
              <Video size={20} /> Video Conference
  {pendingCalls.length > 0 && (
    <span style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold'
    }}>
      {pendingCalls.length}
    </span>
  )}
            </button>
            <button
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={20} /> Analytics
            </button>
          </nav>
        </aside>

        <main className="dash-content">

          {/* Stats */}
          {activeTab !== 'video' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon bg-blue"><Users size={24} /></div>
                <div>
                  <h4>Total Patients</h4>
                  <p>{stats.total}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-green"><CalendarIcon size={24} /></div>
                <div>
                  <h4>Appointments Today</h4>
                  <p>{stats.today}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-orange"><Clock size={24} /></div>
                <div>
                  <h4>Pending Requests</h4>
                  <p>{stats.pending}</p>
                </div>
              </div>
            </div>
          )}

          {/* Appointments View */}
          {activeTab === 'appointments' && (
            <div className="content-card">
              <div className="card-header">
                <h2>Upcoming Appointments</h2>
              </div>
              <div className="table-responsive">
                {appointments.length === 0 ? (
                  <p className="no-data-msg">No appointments found.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((apt) => (
                        <tr key={apt.id || Math.random()}>
                          <td className="fw-600">{apt.patient_name}</td>
                          <td>{apt.date}, {apt.time}</td>
                          <td>
                            <span className={`badge-type ${apt.type && apt.type.toLowerCase().includes('online') ? 'online' : 'clinic'}`}>
                              {apt.type && apt.type.toLowerCase().includes('online') ? <Video size={14} /> : <MapPin size={14} />}
                              {apt.type}
                            </span>
                          </td>
                          <td>
                            <span className={`status-dot ${apt.status.toLowerCase()}`}></span>
                            {apt.status}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {apt.status === 'Pending' || apt.status === 'Confirmed' ? (
                                <>
                                  {apt.status === 'Pending' && (
                                    <>
                                      <button className="btn-icon accept" title="Accept" onClick={() => handleStatusUpdate(apt.id, 'Confirmed')}><CheckCircle size={18} /></button>
                                      <button className="btn-icon decline" title="Decline" onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}><XCircle size={18} /></button>
                                    </>
                                  )}

                                  {apt.status === 'Confirmed' && (
                                    <button
                                      className="btn-icon complete"
                                      title="Complete & Upload"
                                      onClick={() => handleStatusUpdate(apt.id, 'Completed')}
                                      style={{ color: '#10b981' }}
                                    >
                                      <Upload size={18} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Completed</span>
                              )}

                              {apt.type && apt.type.toLowerCase().includes('online') && (
                                <button
                                  className="btn-icon video-call"
                                  title="Start Video Call"
                                  onClick={() => startVideoCall(apt)}
                                  style={{ color: '#007bff', marginLeft: '8px', opacity: apt.status === 'Confirmed' ? 1 : 0.5, pointerEvents: apt.status === 'Confirmed' ? 'auto' : 'none' }}
                                >
                                  <Video size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Upload Modal */}
          <AttachmentUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSubmit={handleUploadSubmit}
            isSubmitting={isUploading}
          />

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <RevenueAnalytics bookingHistory={appointments} doctorProfile={doctorProfile} />
          )}

          {/* Availability Scheduler View */}
          {activeTab === 'schedule' && (
            <div className="content-card">
              <div className="card-header">
                <h2>Manage Availability</h2>
                <p className="card-sub">Set the times you are free so patients can book you.</p>
              </div>

              {/* Blocked Dates Calendar */}
              <div className="blocked-dates-section">
                <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '12px' }}>📅 Block Cancelled Dates</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Select dates on the calendar to block them. Patients will not be able to book appointments on these days.
                </p>
                <div className="calendar-wrapper">
                  <Calendar
                    onClickDay={handleDateClick}
                    tileClassName={tileClassName}
                    minDate={new Date()} // Prevent blocking past dates
                  />

                  {/* Legend */}
                  <div className="calendar-legend">
                    <div className="legend-item">
                      <div className="legend-dot available"></div>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot blocked"></div>
                      <span>Blocked</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot today"></div>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Quick Schedule Generator */}
              <div className="quick-schedule-box">
                <h4 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>⚡ Set Daily Schedule</h4>
                <div className="quick-form-row">
                  <div className="quick-time-group">
                    <label>From:</label>
                    <input type="time" value={dailyConfig.start} onChange={e => setDailyConfig({ ...dailyConfig, start: e.target.value })} />
                    <label>To:</label>
                    <input type="time" value={dailyConfig.end} onChange={e => setDailyConfig({ ...dailyConfig, end: e.target.value })} />
                  </div>
                  <button className="btn-add-slot" style={{ background: '#4b5563', marginLeft: 'auto' }} onClick={handleApplyDailySchedule}>
                    <Plus size={16} style={{ marginRight: '4px' }} /> Generate
                  </button>

                  {undoStack && (
                    <button
                      className="btn-add-slot"
                      style={{ background: '#fee2e2', color: '#ef4444', marginLeft: '10px', border: '1px solid #fecaca' }}
                      onClick={handleUndo}
                    >
                      ↩ Undo
                    </button>
                  )}
                </div>
                <div className="day-toggles">
                  {allDays.map(day => (
                    <div
                      key={day}
                      className={`day-chip ${selectedDays.includes(day) ? 'selected' : ''}`}
                      onClick={() => handleToggleDay(day)}
                    >
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              <h3 style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 12px 0' }}>Add Single Exception / Slot</h3>
              <div className="schedule-form">
                <select
                  value={newSlot.day}
                  onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <div className="time-inputs">
                  <input
                    type="time"
                    value={newSlot.start_time} // Changed to start_time
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={newSlot.end_time} // Changed to end_time
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
                <button className="btn-add-slot" onClick={addSlot}>
                  <Plus size={18} /> Add Slot
                </button>
              </div>

              <div className="slots-grid-display">
                {mySlots.length === 0 ? (
                  <p className="no-data">No slots added. You appear as "Unavailable".</p>
                ) : (
                  mySlots.map((slot, index) => (
                    <div key={slot.id || index} className="time-slot-card">
                      <div className="slot-info">
                        <strong>{slot.day}</strong>
                        {/* Use snake_case to read data from backend */}
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <button onClick={() => removeSlot(slot.id)} className="btn-delete-slot">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
          }

          {/* Video Conference View (Lobby & Active) */}
          {
            activeTab === 'video' && (
              activeVideoCall ? (
                // --- ACTIVE CALL UI ---
                <div className="content-card video-conference-container">
                  <div className="video-header">
                    <h2>Live Consultation</h2>
                    <div className="video-meta">
                      <span className="patient-name">Patient: {activeVideoCall.patient_name}</span>
                      <span className="live-badge">● LIVE</span>
                    </div>
                  </div>

                  <div className="video-main-area">
                    {/* Main Video (Patient) */}
                    <div className="video-feed patient-feed">
                      <div className="video-placeholder">
                        <Users size={64} />
                        <p>Patient Feed (Mock)</p>
                      </div>
                    </div>

                    {/* Picture-in-Picture (Doctor/Self) */}
                    <div className="video-feed self-feed">
                      {cameraOn ? (
                        <div className="video-placeholder-small">
                          <span style={{ fontSize: '12px' }}>You</span>
                        </div>
                      ) : (
                        <div className="video-placeholder-small camera-off">
                          <VideoOff size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="video-controls">
                    <button
                      className={`ctrl-btn ${micOn ? '' : 'off'}`}
                      onClick={() => setMicOn(!micOn)}
                      title={micOn ? "Mute" : "Unmute"}
                    >
                      {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    <button
                      className="ctrl-btn end-call"
                      onClick={endVideoCall}
                      title="End Call"
                    >
                      <PhoneOff size={24} />
                    </button>

                    <button
                      className={`ctrl-btn ${cameraOn ? '' : 'off'}`}
                      onClick={() => setCameraOn(!cameraOn)}
                      title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                    >
                      {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                  </div>
                </div>
              ) : (
                // --- LOBBY UI (No Active Call) ---
                <div className="content-card">
                  <div className="card-header">
                    <h2>Video Conference Lobby</h2>
                    <p className="card-sub">All your scheduled online consultations appear here.</p>
                  </div>

                  <div className="table-responsive">
                    {appointments.filter(a => a.type && a.type.toLowerCase().includes('online')).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <Video size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No online consultations scheduled.</p>
                      </div>
                    ) : (
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments
                            .filter(a => a.type && a.type.toLowerCase().includes('online'))
                            .map(apt => (
                              <tr key={apt.id || Math.random()}>
                                <td className="fw-600">{apt.patient_name}</td>
                                <td>{apt.time} ({apt.date})</td>
                                <td>
                                  <span className={`status-dot ${apt.status.toLowerCase()}`}></span>
                                  {apt.status}
                                </td>
                                <td>
                                  <button
                                    className="btn-add-slot"
                                    style={{ margin: 0, padding: '6px 12px', fontSize: '0.9rem' }}
                                    onClick={() => startVideoCall(apt)}
                                  >
                                    <Video size={16} style={{ marginRight: '6px' }} /> Join Call
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )
            )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;