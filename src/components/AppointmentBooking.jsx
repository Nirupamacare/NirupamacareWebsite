import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loadingDoc, setLoadingDoc] = useState(true);

    // Booking State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [consultType, setConsultType] = useState(''); // Will be set after doctor loads
    const [availableSlots, setAvailableSlots] = useState([]);

    // UI State
    const [showSuccess, setShowSuccess] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [userData, setUserData] = useState({ name: '' });

    // Initial Load: Fetch Doctor and user profile
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Doctor
                const docData = await api.getDoctorById(doctorId);
                if (docData) {
                    // Map backend fields to UI
                    const mappedDoc = {
                        ...docData,
                        name: docData.display_name || docData.name || "Doctor",
                        // Strictly respect 0 as "Not Available"
                        consultationFee: docData.price_clinic !== undefined ? docData.price_clinic : (docData.consultationFee || 0),
                        consultationFeeOnline: docData.price_online !== undefined ? docData.price_online : 0,
                        specialization: docData.specialty || docData.specialization || "Specialist",
                        profile_image_url: docData.profile_image_url || "", // Added mapping
                        searchedAvailabilities: docData.availabilities || []
                    };
                    setDoctor(mappedDoc);

                    // Set default consult type based on availability
                    if (mappedDoc.consultationFee > 0) {
                        setConsultType('Clinic Visit');
                    } else if (mappedDoc.consultationFeeOnline > 0) {
                        setConsultType('Online Consult');
                    }

                } else {
                    alert("Doctor not found");
                    navigate('/doctors');
                }

                // Fetch current user name
                const userProfile = await api.getPatientProfile().catch(() => null);
                if (userProfile) {
                    setUserData({ name: userProfile.full_name });
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoadingDoc(false);
            }
        };

        if (doctorId) fetchData();

        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, [doctorId, navigate]);

    // Generate Slots based on doctor availability for selected date
    useEffect(() => {
        const generateSlotsForDate = () => {
            if (!selectedDate || !doctor) return;

            const dateObj = new Date(selectedDate);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

            const dayAvail = doctor.searchedAvailabilities?.find(a => a.day === dayName);

            if (!dayAvail) {
                setAvailableSlots([]);
                return;
            }

            const slots = [];
            let current = new Date(`2000-01-01T${dayAvail.start_time}`);
            const end = new Date(`2000-01-01T${dayAvail.end_time}`);

            // Get current time to compare
            const now = new Date();
            // Check if selectDate is today (compare YYYY-MM-DD strings to avoid offset issues)
            const isToday = selectedDate === now.toISOString().split('T')[0];

            while (current < end) {
                const timeStr = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                let isSlotAvailable = true;

                if (isToday) {
                    // Create a comparable date object for this slot today
                    const slotDateTime = new Date();
                    slotDateTime.setHours(current.getHours(), current.getMinutes(), 0, 0);

                    // If slot time is in the past, disable it
                    if (slotDateTime < now) {
                        isSlotAvailable = false;
                    }
                }

                slots.push({ time: timeStr, available: isSlotAvailable });
                current.setMinutes(current.getMinutes() + 30);
            }

            setAvailableSlots(slots);
            setSelectedSlot('');
        };

        generateSlotsForDate();
    }, [selectedDate, doctor]);

    // Generate next 7 days for calendar
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push({
                fullDate: d.toISOString().split('T')[0],
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate()
            });
        }
        return dates;
    };

    const handleBook = async () => {
        if (!selectedSlot) return;
        setIsBooking(true);
        try {
            const bookingPayload = {
                doctor_id: doctorId,
                date: selectedDate,
                time: selectedSlot,
                type: consultType,
            };

            const result = await api.bookAppointment(bookingPayload);

            if (result) {
                setShowSuccess(true);
            } else {
                alert("Booking Failed");
            }

        } catch (error) {
            console.error("Booking Error:", error);
            const errorMsg = error.response?.data?.detail
                || (typeof error.response?.data === 'string' ? error.response.data : "")
                || error.message
                || "Unknown Error";
            alert(`Booking Failed: ${errorMsg}. Please ensure you are logged in as a patient.`);
        } finally {
            setIsBooking(false);
        }
    };

    if (loadingDoc) return <div className="booking-page">Loading...</div>;
    if (!doctor) return null;

    // determine availabilities for rendering
    const hasClinic = doctor.consultationFee > 0;
    const hasOnline = doctor.consultationFeeOnline > 0;

    if (!hasClinic && !hasOnline) {
        return (
            <div className="booking-page">
                <header className="booking-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <h2>Appointment</h2>
                </header>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p>This doctor has not set up consultation fees yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="booking-page">
            <header className="booking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>Appointment</h2>
            </header>

            {/* Doctor Card */}
            <div className="booking-doctor-card">
                <img
                    src={doctor.profile_image_url || `https://ui-avatars.com/api/?name=${doctor.name}&background=random`}
                    alt={doctor.name}
                    className="booking-doc-img"
                    style={{ objectFit: 'cover' }}
                />
                <h3 className="booking-doc-name">{doctor.name}</h3>
                <p className="booking-doc-spec">{doctor.specialization}</p>
                <div className="booking-tags">
                </div>
            </div>

            {/* Consultation Type */}
            <div className="consultation-type">
                {hasClinic && (
                    <div
                        className={`type-option ${consultType === 'Clinic Visit' ? 'selected' : ''}`}
                        onClick={() => setConsultType('Clinic Visit')}
                        style={!hasOnline ? { width: '100%' } : {}}
                    >
                        <span className="type-label">Clinic Visit</span>
                        <span className="type-price">₹{doctor.consultationFee}</span>
                    </div>
                )}
                {hasOnline && (
                    <div
                        className={`type-option ${consultType === 'Online Consult' ? 'selected' : ''}`}
                        onClick={() => setConsultType('Online Consult')}
                        style={!hasClinic ? { width: '100%' } : {}}
                    >
                        <span className="type-label">Online Consult</span>
                        <span className="type-price">₹{doctor.consultationFeeOnline}</span>
                    </div>
                )}
            </div>

            {/* Calendar */}
            <div className="calendar-section">
                <div className="month-header">
                    <span>{new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="days-grid">
                    {generateDates().map((dateItem) => (
                        <div key={dateItem.fullDate}>
                            <div className="day-label">{dateItem.dayName}</div>
                            <div
                                className={`date-btn ${selectedDate === dateItem.fullDate ? 'selected' : ''}`}
                                onClick={() => setSelectedDate(dateItem.fullDate)}
                            >
                                {dateItem.dayNum}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Slots */}
            <div className="slots-section">
                <h3>Available Slots</h3>
                <div className="slots-grid">
                    {availableSlots.length > 0 ? availableSlots.map((slot, idx) => (
                        <button
                            key={idx}
                            className={`slot-btn ${slot.available ? '' : 'booked'} ${selectedSlot === slot.time ? 'selected' : ''}`}
                            onClick={() => slot.available && setSelectedSlot(slot.time)}
                            disabled={!slot.available}
                        >
                            {slot.time}
                        </button>
                    )) : (
                        <p>No slots available for this day.</p>
                    )}
                </div>
            </div>

            {/* Confirm Button */}
            <button
                className="btn-confirm-booking"
                onClick={handleBook}
                disabled={!selectedSlot || isBooking || !consultType}
            >
                {isBooking ? 'Booking...' : 'Book Appointment'}
            </button>

            {/* Success Modal */}
            {showSuccess && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-icon">✅</div>
                        <h2>Booking Confirmed!</h2>
                        <p>Your appointment with {doctor.name} is confirmed for {selectedDate} at {selectedSlot}.</p>
                        <button
                            className="btn-confirm-booking"
                            style={{ marginTop: '20px' }}
                            onClick={() => navigate('/home')}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentBooking;
