import express from 'express';
import { searchDoctors, getDoctorById } from '../controllers/doctor.controller.js';
import { analyzeSymptoms } from '../controllers/symptom.controller.js';
import { getAvailability, bookAppointment, getAllAppointments } from '../controllers/appointment.controller.js';

const router = express.Router();

// Doctor Endpoints
router.get('/doctors', searchDoctors);
router.get('/doctors/:id', getDoctorById);

// Symptom Endpoint
router.post('/analyze', analyzeSymptoms);

// Appointment Endpoints
router.get('/appointments/availability', getAvailability);
router.post('/appointments/book', bookAppointment);
router.get('/appointments', getAllAppointments);

export default router;
