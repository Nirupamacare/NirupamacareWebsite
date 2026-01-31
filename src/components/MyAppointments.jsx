import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Calendar, Clock, Video, MapPin, ArrowLeft, AlertCircle, CheckCircle, XCircle, FileText, Download, Eye, X } from 'lucide-react';
import './MyAppointments.css';

const MyAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // For lightbox

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.getPatientAppointments();
                setAppointments(data.reverse());

                // Check for newly confirmed appointments
                checkForNewConfirmations(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // Check for newly confirmed appointments
    const checkForNewConfirmations = (appointments) => {
        // Get previously seen confirmed appointments from localStorage
        const seenConfirmations = JSON.parse(localStorage.getItem('seenConfirmations') || '[]');

        // Find confirmed appointments that haven't been seen yet
        const newConfirmations = appointments.filter(apt =>
            apt.status === 'Confirmed' && !seenConfirmations.includes(apt.id)
        );

        if (newConfirmations.length > 0) {
            // Show notification for the first new confirmation
            const apt = newConfirmations[0];
            setNotification({
                message: `Your appointment is confirmed by the doctor at ${apt.time} on ${apt.date}`,
                type: 'success',
                appointmentId: apt.id
            });

            // Mark this appointment as seen
            const updatedSeen = [...seenConfirmations, apt.id];
            localStorage.setItem('seenConfirmations', JSON.stringify(updatedSeen));
        }
    };

    // Close notification
    const closeNotification = () => {
        setNotification(null);
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

            {/* Notification Banner */}
            {notification && (
                <div className={`notification-banner ${notification.type}`}>
                    <div className="notification-content">
                        <CheckCircle size={20} />
                        <span>{notification.message}</span>
                    </div>
                    <button className="notification-close" onClick={closeNotification}>×</button>
                </div>
            )}

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
                            <div className="apt-main-row">
                                <div className="apt-left">
                                    <div className="apt-info">
                                        <div className="apt-header">
                                            <h3 className="apt-title">{apt.type === 'Online Consult' ? 'Video Consultation' : 'Clinic Visit'}</h3>
                                            <span className="apt-id">#{apt.id.slice(-6)}</span>
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
                                    </div>
                                </div>

                                <div className="apt-right">
                                    <div className="apt-status">
                                        <span className={`status-badge ${getStatusClass(apt.status)}`}>
                                            <span className="status-dot"></span>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </div>



                            {/* Attachments Section */}
                            {apt.attachments && apt.attachments.length > 0 && (
                                <div className="apt-attachments-section">
                                    <h4>Medical Documents</h4>
                                    <div className="attachments-grid">
                                        {apt.attachments.map((fileData, index) => {
                                            const isPdf = fileData.startsWith('data:application/pdf');
                                            const isImage = fileData.startsWith('data:image');

                                            return (
                                                <div key={index} className="attachment-item">
                                                    {isImage ? (
                                                        <div className="att-preview-box" onClick={() => setPreviewImage(fileData)}>
                                                            <img src={fileData} alt="Prescription" />
                                                            <div className="att-overlay">
                                                                <Eye size={16} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="att-pdf-box">
                                                            <FileText size={24} className="text-red-500" />
                                                            <span className="att-label">Prescription (PDF)</span>
                                                            <a href={fileData} download={`Prescription-${apt.date}.pdf`} className="att-download-btn">
                                                                <Download size={14} />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox for Image Preview */}
            {previewImage && (
                <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
                    <button className="lightbox-close"><X size={24} /></button>
                    <img src={previewImage} alt="Full Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div >
    );
};

export default MyAppointments;