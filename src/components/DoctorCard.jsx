import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './Doctors.css'; // Shared styles

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    // Map backend snake_case to UI fields
    const name = doctor.display_name || doctor.name || "Unknown Doctor";
    const specialization = doctor.specialty || doctor.specialization || "General";
    const clinicName = doctor.clinic_name || doctor.clinicName || "Private Clinic";
    const location = doctor.clinic_address || doctor.location || "Online";
    const rating = doctor.rating || 0;
    const clinicFee = doctor.price_clinic || 0;
    const onlineFee = doctor.price_online || 0;
    const feeDisplay = [];
    if (clinicFee > 0) feeDisplay.push(`₹${clinicFee} (Clinic)`);
    if (onlineFee > 0) feeDisplay.push(`₹${onlineFee} (Online)`);
    if (feeDisplay.length === 0) feeDisplay.push("Consult Fee N/A");

    const slots = doctor.availabilities || doctor.availableSlots || [];
    const verified = true; // Placeholder

    // Prioritize Base64 profile_picture, fallback to URL, then placeholder
    const imageUrl = doctor.profile_picture || doctor.profile_image_url || `https://ui-avatars.com/api/?name=${name}&background=random`;

    return (
        <div className="doctor-card">
            <div className="doctor-card-content">
                <div className="doctor-image-container">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="doctor-img"
                    />
                    {verified && <span className="verified-badge">✓ Verified</span>}
                </div>

                <div className="doctor-info">
                    <h3 className="doctor-name">{name}</h3>
                    <p className="doctor-specialization">{specialization}</p>
                    <p className="doctor-clinic">🏥 {clinicName}</p>
                    <p className="doctor-location">📍 {location}</p>

                    <div className="doctor-meta">
                        <span className="doctor-rating">⭐ {rating}</span>
                        <span className="doctor-fee">{feeDisplay.join(" | ")}</span>
                    </div>

                    <div className="doctor-slots">
                        <p className="slots-label">Available Times:</p>
                        <div className="slots-list">
                            {slots.length > 0 ? (
                                slots.map((slot, index) => (
                                    <span key={index} className="slot-pill">
                                        {slot.day ? `${slot.day.substring(0, 3)} ` : ''}{slot.start_time || slot}
                                    </span>
                                ))
                            ) : (
                                <span className="no-slots">No specific slots listed</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="doctor-card-actions">
                <button
                    className="btn-view-profile"
                    onClick={() => navigate(`/doctor-profile/${doctor._id || doctor.id}`)}
                >View Profile</button>
                <button
                    className="btn-book-appointment"
                    onClick={() => {
                        if (isAuthenticated) {
                            navigate(`/book-appointment/${doctor._id || doctor.id}`);
                        } else {
                            navigate('/login');
                        }
                    }}
                    title={!isAuthenticated ? 'Login required to book appointment' : 'Book an appointment'}
                >
                    {isAuthenticated ? 'Book Appointment' : '🔒 Login to Book'}
                </button>
            </div>
        </div>
    );
};

export default DoctorCard;
