import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to resolve paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/doctors_db.json');

// Helper to read DB
const getDoctorsData = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading doctors database:", error);
        return [];
    }
};

export const searchDoctors = (req, res) => {
    try {
        const { location, specialization } = req.query;
        let doctors = getDoctorsData();

        // 1. Filter by Verified (Always)
        doctors = doctors.filter(doc => doc.verified === true);

        // 2. Filter by Location (Case-insensitive fuzzy match)
        if (location) {
            const locTerm = location.toLowerCase().trim();
            doctors = doctors.filter(doc =>
                doc.location.toLowerCase().includes(locTerm)
            );
        }

        // 3. Filter by Specialization (Exact match, but case-insensitive safe)
        if (specialization) {
            const specTerm = specialization.toLowerCase().trim();
            doctors = doctors.filter(doc =>
                doc.specialization.toLowerCase() === specTerm
            );
        }

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error during doctor search."
        });
    }
};

export const getDoctorById = (req, res) => {
    try {
        const { id } = req.params;
        const doctors = getDoctorsData();
        const doctor = doctors.find(doc => doc.id === id);

        if (doctor) {
            res.status(200).json({ success: true, data: doctor });
        } else {
            res.status(404).json({ success: false, message: "Doctor not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
