import axios from 'axios';
import { auth } from './firebase';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

const API_URL = "https://api-48aa.vercel.app/v1";
//const API_URL = "http://localhost:8000/v1";

// --- Helper: Get Token robustly ---
const getAuthToken = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                const token = await user.getIdToken();
                resolve(token);
            } else {
                reject(new Error("User not authenticated"));
            }
        });
    });
};

export const api = {

    // ================================
    // 1. AUTHENTICATION (Login/Signup)
    // ================================

    register: async ({ email, password, full_name, role }) => {
        try {
            // 1. Create User in Firebase
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseToken = await userCred.user.getIdToken();

            // 2. Register User in Backend
            const payload = {
                role_request: role || "patient_free",
                first_name: full_name ? full_name.split(' ')[0] : '',
                last_name: full_name ? full_name.split(' ').slice(1).join(' ') : '',
                email: email
            };

            const response = await axios.post(`${API_URL}/auth/register`, payload, {
                headers: { Authorization: `Bearer ${firebaseToken}` }
            });

            return response.data;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        }
    },

    login: async (email, password) => {
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCred.user.getIdToken();
            // In a production app, you typically fetch the user's role from your backend here
            // For now, we return the firebase user and a successful role indicator
            return { user: userCred.user, token: token, role: 'doctor' };
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    logout: async () => {
        await signOut(auth);
    },

    // Sync authenticated user with backend (for Login.jsx)
    authenticate: async (token, formData) => {
        try {
            const payload = {
                role_request: "patient_free", // Default role for regular login
                first_name: formData.fullName ? formData.fullName.split(' ')[0] : '',
                last_name: formData.fullName ? formData.fullName.split(' ').slice(1).join(' ') : '',
                email: formData.identifier
            };

            const response = await axios.post(`${API_URL}/auth/register`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error) {
            console.error("Authentication Sync Error:", error);
            throw error;
        }
    },

    // ================================
    // 2. DOCTOR PROFILE & DASHBOARD
    // ================================

    // Create or Update Profile
    createDoctorProfile: async (profileData) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${API_URL}/doctor/profile`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Create Doctor Profile Error:", error);
            throw error;
        }
    },

    // Upload Doctor Photo
    uploadDoctorPhoto: async (file) => {
        try {
            const token = await getAuthToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_URL}/doctor/upload-photo`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                    // Removed manual Content-Type: multipart/form-data to let Axios set it with boundary
                }
            });
            return response.data; // { url: "..." }
        } catch (error) {
            console.error("Upload Photo Error:", error);
            throw error;
        }
    },

    // Get Current Doctor Profile (Name, Specialty, etc.)
    getDoctorProfile: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${API_URL}/doctor/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Get Doctor Profile Error:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    // Fetch Appointments from Backend
    getDoctorAppointments: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${API_URL}/doctor/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data; // Expecting Array of appointments
        } catch (error) {
            console.error("Get Appointments Error:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            // Return empty array to prevent UI crash if endpoint fails or returns 404
            return [];
        }
    },

    updateAppointmentStatus: async (appointmentId, status) => {
        try {
            const token = await getAuthToken();
            const response = await axios.put(`${API_URL}/doctor/appointments/${appointmentId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Update Status Error:", error);
            throw error;
        }
    },

    // Fetch Availability Slots
    getDoctorAvailability: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${API_URL}/doctor/availability`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data; // Expecting Array of slots
        } catch (error) {
            console.error("Get Availability Error:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            return [];
        }
    },

    // Update Availability Slots
    updateAvailability: async (slots) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${API_URL}/doctor/availability`, { slots }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Update Availability Error:", error);
            throw error;
        }
    },

    // ================================
    // 4. SEARCH DOCTORS (Public)
    // ================================

    // Search/List all doctors with optional filters
    searchDoctors: async ({ location, specialization } = {}) => {
        try {
            const params = new URLSearchParams();
            if (location) params.append('location', location);
            if (specialization) params.append('specialization', specialization);

            const queryString = params.toString();
            const url = queryString ? `${API_URL}/doctor/list?${queryString}` : `${API_URL}/doctor/list`;

            // Try to get token robustly
            let headers = {};
            try {
                const token = await getAuthToken();
                headers = { Authorization: `Bearer ${token}` };
            } catch (e) {
                // Not authenticated or error
            }

            const response = await axios.get(url, { headers });
            return response.data; // Returns array of DoctorPublic
        } catch (error) {
            console.error("Search Doctors Error:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            // If 401, it means we needed a token but didn't have one (or it expired)
            return [];
        }
    },

    // Get specific doctor by ID
    getDoctorById: async (id) => {
        try {
            let headers = {};
            try {
                const token = await getAuthToken();
                headers = { Authorization: `Bearer ${token}` };
            } catch (e) { }

            const response = await axios.get(`${API_URL}/doctor/${id}`, { headers });
            return response.data;
        } catch (error) {
            console.error("Get Doctor By ID Error:", error);
            throw error;
        }
    },

    // ================================
    // 5. APPOINTMENTS (Patient)
    // ================================

    bookAppointment: async (bookingData) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${API_URL}/patient/appointments/book`, bookingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Book Appointment Error:", error);
            throw error;
        }
    },

    // ================================
    // 3. PATIENT PROFILE
    // ================================

    createPatientProfile: async (profileData) => {
        try {
            const token = await getAuthToken();

            const payload = {
                full_name: profileData.fullName,
                age: parseInt(profileData.age) || 0,
                gender: profileData.gender,
                city: profileData.city,
                pin_code: profileData.pincode,
                family_members: profileData.familyMembers.map(m => ({
                    full_name: m.name,
                    age: parseInt(m.age) || 0,
                    relationship: m.relationship
                }))
            };

            const response = await axios.post(
                `${API_URL}/patient/profile`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Profile Creation Error:", error.response?.data || error.message);
            throw error;
        }
    },

    getPatientProfile: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(
                `${API_URL}/patient/profile`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.log("Could not fetch profile (User might be new or network error)");
            throw error;
        }
    },

    getPatientAppointments: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${API_URL}/patient/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Get Patient Appointments Error:", error);
            throw error;
        }
    }
};