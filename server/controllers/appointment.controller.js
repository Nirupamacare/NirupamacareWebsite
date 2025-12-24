import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Mock DB Access
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appointmentsDbPath = path.join(__dirname, '../data/appointments_db.json');

const getAppointmentsData = () => {
    try {
        if (!fs.existsSync(appointmentsDbPath)) {
            return [];
        }
        const data = fs.readFileSync(appointmentsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading appointments database:", error);
        return [];
    }
};

const saveAppointmentsData = (data) => {
    try {
        fs.writeFileSync(appointmentsDbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error saving appointments database:", error);
        return false;
    }
};

// Generate slots for a given day (Mock Logic)
const generateSlots = (doctorId, date) => {
    // In a real app, we'd check the doctor's specific working hours for this day.
    // For now, we assume 10 AM to 6 PM with 45 min intervals
    const slots = [
        "10:00 AM", "10:45 AM", "11:30 AM", "12:15 PM",
        "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM", "05:00 PM"
    ];
    return slots;
};

export const getAvailability = (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: "Missing doctorId or date" });
        }

        const allSlots = generateSlots(doctorId, date);
        const appointments = getAppointmentsData();

        // Find booked slots for this doctor on this date
        const bookedSlots = appointments
            .filter(appt => appt.doctorId === doctorId && appt.date === date)
            .map(appt => appt.timeSlot);

        // Map to availability objects
        const availability = allSlots.map(slot => ({
            time: slot,
            available: !bookedSlots.includes(slot)
        }));

        res.status(200).json({
            success: true,
            date,
            slots: availability
        });

    } catch (error) {
        console.error("Availability Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const bookAppointment = (req, res) => {
    try {
        const { doctorId, doctorName, date, timeSlot, consultationType, userName } = req.body;

        // Basic Validation
        if (!doctorId || !date || !timeSlot) {
            return res.status(400).json({ success: false, message: "Missing required booking details." });
        }

        let appointments = getAppointmentsData();

        // Check availability again (Prevent Double Booking)
        const isTaken = appointments.some(appt =>
            appt.doctorId === doctorId &&
            appt.date === date &&
            appt.timeSlot === timeSlot
        );

        if (isTaken) {
            return res.status(409).json({ success: false, message: "Slot already booked. Please choose another." });
        }

        // Create new appointment
        const newAppointment = {
            id: 'appt_' + Date.now(),
            doctorId,
            doctorName,
            userId: 'guest_user_001', // Mock User ID
            userName: userName || 'Guest',
            date,
            timeSlot,
            consultationType: consultationType || 'Clinic Visit',
            status: 'booked',
            createdAt: new Date().toISOString()
        };

        appointments.push(newAppointment);

        if (saveAppointmentsData(appointments)) {
            // Mock Notification
            console.log(`[NOTIFICATION] Email sent to user for appointment: ${newAppointment.id}`);
            console.log('✅ Appointment Stored:', JSON.stringify(newAppointment, null, 2));

            res.status(201).json({
                success: true,
                message: "Appointment booked successfully!",
                data: newAppointment
            });
        } else {
            throw new Error("Database Write Failed");
        }

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error during booking." });
    }
};

export const getAllAppointments = (req, res) => {
    try {
        const appointments = getAppointmentsData();
        console.log(`🔍 Retrieved ${appointments.length} appointments for verification.`);
        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error("Get All Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
