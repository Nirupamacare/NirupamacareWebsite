import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, Video, MapPin,
  CheckCircle, XCircle, Plus, Trash2, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../api';
import { auth } from '../firebase';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(true);

  // Data States
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [mySlots, setMySlots] = useState([]);

  // Stats
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });

  // Form State (Aligned with Backend naming: snake_case)
  const [newSlot, setNewSlot] = useState({ day: 'Monday', start_time: '', end_time: '' });

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

        if (profileData) setDoctorProfile(profileData);
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

  // --- Handlers ---
  const handleLogout = async () => {
    await api.logout();
    navigate('/doctor-login'); // Make sure this matches your Route path
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

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div id="dashboard-root">
      <nav className="dash-navbar">
        <div className="dash-nav-left">
          <img src="/nirupama1.png" alt="Logo" className="dash-logo" />
          <span className="badge-pro">Doctor Portal</span>
        </div>
        <div className="dash-nav-right">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="dash-container">

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="sidebar-profile">
            <div className="avatar-circle">
              {doctorProfile?.display_name ? doctorProfile.display_name[0] : 'D'}
            </div>
            <h3>{doctorProfile?.display_name || "Doctor"}</h3>
            <p>{doctorProfile?.specialty || "Specialist"}</p>
          </div>

          <nav className="sidebar-menu">
            <button
              className={activeTab === 'appointments' ? 'active' : ''}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={20} /> Appointments
            </button>
            <button
              className={activeTab === 'schedule' ? 'active' : ''}
              onClick={() => setActiveTab('schedule')}
            >
              <Clock size={20} /> Manage Schedule
            </button>
          </nav>
        </aside>

        <main className="dash-content">

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon bg-blue"><Users size={24} /></div>
              <div>
                <h4>Total Patients</h4>
                <p>{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green"><Calendar size={24} /></div>
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
                            <span className={`badge-type ${apt.type === 'Online Consult' ? 'online' : 'clinic'}`}>
                              {apt.type === 'Online Consult' ? <Video size={14} /> : <MapPin size={14} />}
                              {apt.type}
                            </span>
                          </td>
                          <td>
                            <span className={`status-dot ${apt.status.toLowerCase()}`}></span>
                            {apt.status}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon accept" title="Accept"><CheckCircle size={18} /></button>
                              <button className="btn-icon decline" title="Decline"><XCircle size={18} /></button>
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

          {/* Availability Scheduler View */}
          {activeTab === 'schedule' && (
            <div className="content-card">
              <div className="card-header">
                <h2>Manage Availability</h2>
                <p className="card-sub">Set the times you are free so patients can book you.</p>
              </div>

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
          )}

        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;