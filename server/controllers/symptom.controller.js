import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYMPTOM_MAP } from '../services/symptom_map.js';

// Setup Mock DB Access
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/doctors_db.json');

const getDoctorsData = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading doctors database:", error);
        return [];
    }
};

export const analyzeSymptoms = (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a description of your symptoms."
            });
        }

        const text = symptoms.toLowerCase();
        let identifiedSpecialization = "General Physician"; // Default fallback
        let identifiedReason = "Based on your symptoms, we recommend a general checkup.";

        // --- MOCK AI LOGIC ---
        // Iterate through map keys to find a match
        for (const [key, specialization] of Object.entries(SYMPTOM_MAP)) {
            if (text.includes(key)) {
                identifiedSpecialization = specialization;
                identifiedReason = `Your mention of '${key}' suggests you should see a ${specialization}.`;
                break; // Stop at first match for this simple version
            }
        }

        // --- FIND DOCTORS ---
        const allDoctors = getDoctorsData();
        const matchedDoctors = allDoctors.filter(doc =>
            doc.verified === true &&
            doc.specialization === identifiedSpecialization
        );

        res.status(200).json({
            success: true,
            specialization: identifiedSpecialization,
            message: identifiedReason,
            doctors: matchedDoctors
        });

    } catch (error) {
        console.error("Analyze Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error during symptom analysis."
        });
    }
};
