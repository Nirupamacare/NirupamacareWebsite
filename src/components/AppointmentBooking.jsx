import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../api';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loadingDoc, setLoadingDoc] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Booking State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [consultType, setConsultType] = useState(''); // Will be set after doctor loads
    const [availableSlots, setAvailableSlots] = useState([]);

    // UI State
    const [showSuccess, setShowSuccess] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [userData, setUserData] = useState({ name: '' });

    // Check authentication first
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setCheckingAuth(false);

            if (!user) {
                // User is not authenticated, redirect to login
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Initial Load: Fetch Doctor and user profile
    useEffect(() => {
        // Only fetch data if authenticated
        if (checkingAuth || !isAuthenticated) return;

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
                        profile_image_url: docData.profile_image_url || "",
                        profile_picture: docData.profile_picture || "", // Add Base64 field
                        searchedAvailabilities: docData.availabilities || [],
                        blocked_dates: docData.blocked_dates || [] // Map blocked dates
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

                // Fetch current user name - this will now always get fresh data
                const userProfile = await api.getPatientProfile().catch(() => null);
                if (userProfile) {
                    setUserData({ name: userProfile.full_name });
                } else {
                    // Clear any stale data
                    setUserData({ name: '' });
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                // If there's an auth error, redirect to login
                if (error.message === "User not authenticated") {
                    navigate('/login');
                }
            } finally {
                setLoadingDoc(false);
            }
        };

        if (doctorId) fetchData();

        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, [doctorId, navigate, isAuthenticated, checkingAuth]);

    // Generate Slots based on doctor availability for selected date
    useEffect(() => {
        const generateSlotsForDate = () => {
            if (!selectedDate || !doctor) return;

            const dateObj = new Date(selectedDate);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

            console.log('🔍 Slot Generation Debug:');
            console.log('Selected Date:', selectedDate);
            console.log('Day Name:', dayName);
            console.log('Doctor Availabilities:', doctor.searchedAvailabilities);

            // Find ALL availabilities for this day (doctor may have multiple time blocks)
            const dayAvailabilities = doctor.searchedAvailabilities?.filter(a => a.day === dayName) || [];

            console.log('Found', dayAvailabilities.length, 'availability periods for', dayName, ':', dayAvailabilities);

            if (dayAvailabilities.length === 0) {
                console.log('❌ No availability found for', dayName);
                setAvailableSlots([]);
                return;
            }

            const allSlots = [];
            const now = new Date();
            const isToday = selectedDate === now.toISOString().split('T')[0];

            // Generate slots for EACH availability period
            dayAvailabilities.forEach((dayAvail, periodIndex) => {
                console.log(`Generating slots for period ${periodIndex + 1}:`, dayAvail.start_time, '-', dayAvail.end_time);


                let current = new Date(`2000-01-01T${dayAvail.start_time}`);
                const end = new Date(`2000-01-01T${dayAvail.end_time}`);

                // Generate 30-minute slots with time ranges
                while (current < end) {
                    const slotStart = new Date(current);
                    const slotEnd = new Date(current);
                    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

                    // Don't create a slot if it would go past the end time
                    if (slotEnd > end) break;

                    const startTimeStr = slotStart.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    const endTimeStr = slotEnd.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    // Store in 24-hour format for backend
                    const timeStr24 = slotStart.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    let isSlotAvailable = true;

                    if (isToday) {
                        // Create a comparable date object for this slot today
                        const slotDateTime = new Date();
                        slotDateTime.setHours(slotStart.getHours(), slotStart.getMinutes(), 0, 0);

                        // If slot time is in the past, disable it
                        if (slotDateTime < now) {
                            isSlotAvailable = false;
                        }
                    }

                    allSlots.push({
                        time: timeStr24, // For backend
                        displayTime: `${startTimeStr} - ${endTimeStr}`, // For UI
                        available: isSlotAvailable
                    });

                    current.setMinutes(current.getMinutes() + 30);
                }
            });

            // Sort slots by time
            allSlots.sort((a, b) => a.time.localeCompare(b.time));

            console.log('✅ Generated', allSlots.length, 'total slots across all periods:', allSlots);
            setAvailableSlots(allSlots);
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
            const dateStr = d.toISOString().split('T')[0];

            // Check if this date is blocked
            const isBlocked = doctor?.blocked_dates?.includes(dateStr);

            dates.push({
                fullDate: dateStr,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                isBlocked: isBlocked
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

            // Check if it's an authentication or role issue
            if (errorMsg.toLowerCase().includes('insufficient role') ||
                errorMsg.toLowerCase().includes('not logged in') ||
                errorMsg.toLowerCase().includes('patient') ||
                error.response?.status === 401 ||
                error.response?.status === 403) {
                // Authentication or role issue - redirect to login
                alert('Login to Book Doctor');
                navigate('/login');
            } else {
                // Other errors
                alert(`Booking Failed: ${errorMsg}`);
            }
        } finally {
            setIsBooking(false);
        }
    };

    if (checkingAuth || loadingDoc) return <div className="booking-page">Loading...</div>;
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
                    src={doctor.profile_picture || doctor.profile_image_url || `https://ui-avatars.com/api/?name=${doctor.name}&background=random`}
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
                    <span>{new Date(selectedDate || new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="days-grid">
                    {generateDates().map((dateItem) => (
                        <div key={dateItem.fullDate}>
                            <div className="day-label">{dateItem.dayName}</div>
                            <button
                                className={`date-btn ${selectedDate === dateItem.fullDate ? 'selected' : ''} ${dateItem.isBlocked ? 'blocked' : ''}`}
                                onClick={() => !dateItem.isBlocked && setSelectedDate(dateItem.fullDate)}
                                disabled={dateItem.isBlocked}
                                title={dateItem.isBlocked ? "Doctor not available" : ""}
                            >
                                {dateItem.dayNum}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Slots */}
            <div className="slots-section">
                <h3>Available Time Slots</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
                    Select a 30-minute time slot for your appointment
                </p>
                <div className="slots-grid">
                    {availableSlots.length > 0 ? availableSlots.map((slot, idx) => (
                        <button
                            key={idx}
                            className={`slot-btn ${slot.available ? '' : 'booked'} ${selectedSlot === slot.time ? 'selected' : ''}`}
                            onClick={() => slot.available && setSelectedSlot(slot.time)}
                            disabled={!slot.available}
                            title={slot.available ? `Book ${slot.displayTime}` : 'Time slot has passed'}
                        >
                            {slot.displayTime}
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
