import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Calendar, Clock, Video, MapPin, ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './MyAppointments.css';

const MyAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningCall, setJoiningCall] = useState(null); // Track which appointment is joining

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.getPatientAppointments();
                setAppointments(data.reverse());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleJoinCall = async (appointment) => {
        try {
            setJoiningCall(appointment.id);
            
            // Check if this appointment already has a call_id stored
            if (appointment.call_id) {
                console.log('Using existing call_id:', appointment.call_id);
                navigate(`/video-call/${appointment.call_id}`);
                return;
            }

            // Create new call request
            console.log('Creating new call request for doctor:', appointment.doctor_id);
            
            if (!appointment.doctor_id) {
                throw new Error('Doctor ID not found in appointment');
            }

            const callRequest = await api.requestCall({
                doctor_id: appointment.doctor_id
            });
            
            console.log('Call request created:', callRequest);

            // Navigate with the new call_id
            // Use 'id' or '_id' depending on what the backend returns
            const callId = callRequest.id || callRequest._id;
            if (!callId) {
                throw new Error('Call ID not returned from server');
            }

            navigate(`/video-call/${callId}`);
            
        } catch (error) {
            console.error('Failed to start call:', error);
            alert(`Failed to start video call: ${error.message || 'Unknown error'}`);
        } finally {
            setJoiningCall(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Confirmed': return 'status-confirmed';
            case 'Cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Confirmed': return <CheckCircle size={16} />;
            case 'Cancelled': return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const isCallAvailable = (appointment) => {
        return appointment.type?.includes('Online') && appointment.status === 'Confirmed';
    };

    return (
        <div className="my-appointments-page">
            <div className="booking-header">
                <button className="back-btn" onClick={() => navigate(-1)} title="Go Back">
                    <ArrowLeft size={24} />
                </button>
                <h2>My Appointments</h2>
            </div>

            {loading ? (
                <div className="loading-state">Loading your appointments...</div>
            ) : appointments.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>You haven't booked any appointments yet.</p>
                    <button className="btn-book-new" onClick={() => navigate('/doctors')}>
                        Book Your First Appointment
                    </button>
                </div>
            ) : (
                <div className="appointments-list">
                    {appointments.map((apt) => (
                        <div key={apt.id} className="appointment-card">
                            <div className="apt-left">
                                <div className="apt-info">
                                    <div className="apt-header">
                                        <h3 className="apt-title">{apt.type === 'Online Consult' ? 'Video Consultation' : 'Clinic Visit'}</h3>
                                        <span className="apt-id">#{apt.id?.slice(-6) || 'N/A'}</span>
                                    </div>

                                    <div className="apt-meta">
                                        <div className="meta-item">
                                            <Calendar size={16} />
                                            <span>{apt.date}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Clock size={16} />
                                            <span>{apt.time}</span>
                                        </div>
                                    </div>

                                    <div className={`apt-type ${apt.type && apt.type.includes('Online') ? 'type-online' : 'type-clinic'}`}>
                                        {apt.type && apt.type.includes('Online') ? <Video size={14} /> : <MapPin size={14} />}
                                        <span>{apt.type}</span>
                                    </div>

                                    {/* Debug info - remove in production */}
                                    {apt.doctor_id && (
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                                            Doctor ID: {apt.doctor_id}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="apt-right">
                                <div className="apt-status">
                                    <span className={`status-badge ${getStatusClass(apt.status)}`}>
                                        <span className="status-dot"></span>
                                        {apt.status}
                                    </span>
                                    
                                    {isCallAvailable(apt) && (
                                        <button 
                                            className="btn-join-call"
                                            onClick={() => handleJoinCall(apt)}
                                            disabled={joiningCall === apt.id}
                                            title="Join Video Call"
                                        >
                                            {joiningCall === apt.id ? (
                                                <>
                                                    {/* <Loader size={16} className="spinner" /> */}
                                                    <span>Connecting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Video size={16} />
                                                    <span>Join Call</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointments;