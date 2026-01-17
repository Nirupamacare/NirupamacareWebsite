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
    }
};