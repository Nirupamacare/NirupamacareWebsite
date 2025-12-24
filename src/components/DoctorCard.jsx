import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Doctors.css'; // Shared styles

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();
    return (
        <div className="doctor-card">
            <div className="doctor-card-content">
                <div className="doctor-image-container">
                    {/* Placeholder for now, or use a generic avatar */}
                    <img
                        src={`https://ui-avatars.com/api/?name=${doctor.name}&background=random`}
                        alt={doctor.name}
                        className="doctor-img"
                    />
                    {doctor.verified && <span className="verified-badge">✓ Verified</span>}
                </div>

                <div className="doctor-info">
                    <h3 className="doctor-name">{doctor.name}</h3>
                    <p className="doctor-specialization">{doctor.specialization}</p>
                    <p className="doctor-clinic">🏥 {doctor.clinicName}</p>
                    <p className="doctor-location">📍 {doctor.location}</p>

                    <div className="doctor-meta">
                        <span className="doctor-rating">⭐ {doctor.rating}</span>
                        <span className="doctor-fee">₹{doctor.consultationFee} / Visit</span>
                    </div>

                    <div className="doctor-slots">
                        <p className="slots-label">Available Today:</p>
                        <div className="slots-list">
                            {doctor.availableSlots.length > 0 ? (
                                doctor.availableSlots.map((slot, index) => (
                                    <span key={index} className="slot-pill">{slot}</span>
                                ))
                            ) : (
                                <span className="no-slots">No slots available</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="doctor-card-actions">
                <button className="btn-view-profile">View Profile</button>
                <button
                    className="btn-book-appointment"
                    onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                >
                    Book Appointment
                </button>
            </div>
        </div>
    );
};

export default DoctorCard;
