import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loadingDoc, setLoadingDoc] = useState(true);

    // Booking State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [consultType, setConsultType] = useState('Clinic Visit');
    const [availableSlots, setAvailableSlots] = useState([]);

    // UI State
    const [showSuccess, setShowSuccess] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Initial Load: Fetch Doctor
    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/doctors/${doctorId}`);
                const data = await response.json();
                if (data.success) {
                    setDoctor(data.data);
                } else {
                    alert("Doctor not found");
                    navigate('/doctors');
                }
            } catch (error) {
                console.error("Error fetching doctor:", error);
            } finally {
                setLoadingDoc(false);
            }
        };

        if (doctorId) fetchDoctor();

        // Default to today text
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, [doctorId, navigate]);

    // Fetch Availability when date changes
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedDate || !doctorId) return;
            try {
                const response = await fetch(`http://localhost:5000/api/appointments/availability?doctorId=${doctorId}&date=${selectedDate}`);
                const data = await response.json();
                if (data.success) {
                    setAvailableSlots(data.slots);
                    setSelectedSlot(''); // Reset slot selection
                }
            } catch (error) {
                console.error("Error fetching slots:", error);
            }
        };

        fetchAvailability();
    }, [selectedDate, doctorId]);

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
            const bookingData = {
                doctorId,
                doctorName: doctor.name,
                date: selectedDate,
                timeSlot: selectedSlot,
                consultationType: consultType,
                userName: "Supriti Mishra" // Mock User
            };

            const response = await fetch('http://localhost:5000/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();
            if (result.success) {
                setShowSuccess(true);
            } else {
                alert(result.message || "Booking Failed");
            }

        } catch (error) {
            console.error("Booking Error:", error);
            alert("Something went wrong.");
        } finally {
            setIsBooking(false);
        }
    };

    if (loadingDoc) return <div className="booking-page">Loading...</div>;
    if (!doctor) return null;

    return (
        <div className="booking-page">
            <header className="booking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>Appointment</h2>
            </header>

            {/* Doctor Card */}
            <div className="booking-doctor-card">
                <img
                    src={`https://ui-avatars.com/api/?name=${doctor.name}&background=random`}
                    alt={doctor.name}
                    className="booking-doc-img"
                />
                <h3 className="booking-doc-name">{doctor.name}</h3>
                <p className="booking-doc-spec">{doctor.specialization} • 15+ years exp</p>
                <div className="booking-tags">
                    <span className="tag">English</span>
                    <span className="tag">Bengali</span>
                </div>
            </div>

            {/* Consultation Type */}
            <div className="consultation-type">
                <div
                    className={`type-option ${consultType === 'Clinic Visit' ? 'selected' : ''}`}
                    onClick={() => setConsultType('Clinic Visit')}
                >
                    <span className="type-label">Clinic Visit</span>
                    <span className="type-price">₹{doctor.consultationFee}</span>
                </div>
                <div
                    className={`type-option ${consultType === 'Online Consult' ? 'selected' : ''}`}
                    onClick={() => setConsultType('Online Consult')}
                >
                    <span className="type-label">Online Consult</span>
                    <span className="type-price">₹{doctor.consultationFee - 100}</span>
                </div>
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
                        <p>No slots available.</p>
                    )}
                </div>
            </div>

            {/* Confirm Button */}
            <button
                className="btn-confirm-booking"
                onClick={handleBook}
                disabled={!selectedSlot || isBooking}
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
