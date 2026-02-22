import axios from 'axios';
import { auth } from './firebase';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

//const API_URL = "https://api-48aa.vercel.app/v1";
//const API_URL = "http://localhost:8000/v1";
const API_URL = "https://nirupamacare-api-gwfmegeffrhqb8cy.centralindia-01.azurewebsites.net/v1";

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
        // Clear all stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('mongo_user_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
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
                    Authorization: `Bearer ${token}`,
                    "Content-Type": undefined,
                }
            });
            return response.data;
        } catch (error) {
            console.error("Upload Photo Error:", error);
            throw error;
        }
    },

    // Resolve a shortened Google Maps URL → get expanded URL + lat/lng
    resolveMapLink: async (url) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(
                `${API_URL}/doctor/resolve-map-link`,
                { url },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data; // { resolved_url, lat, lng }
        } catch (error) {
            console.error("Resolve Map Link Error:", error);
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

    updateAppointmentStatus: async (appointmentId, status, attachments = []) => {
        try {
            const token = await getAuthToken();
            const payload = { status };
            if (attachments && attachments.length > 0) {
                payload.attachments = attachments;
            }
            const response = await axios.put(`${API_URL}/doctor/appointments/${appointmentId}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Update Status Error:", error);
            throw error;
        }
    },

    // Update doctor profile picture (Base64)
    updateDoctorProfilePicture: async (base64Image) => {
        try {
            const token = await getAuthToken();
            const response = await axios.put(`${API_URL}/doctor/profile-picture`,
                { profile_picture: base64Image },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Update Profile Picture Error:", error);
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

    blockDate: async (date) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${API_URL}/doctor/availability/block`, { date }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Block Date Error:", error);
            throw error;
        }
    },

    unblockDate: async (date) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${API_URL}/doctor/availability/unblock`, { date }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Unblock Date Error:", error);
            throw error;
        }
    },

    // ================================
    // 4. SEARCH DOCTORS (Public)
    // ================================

    // Search/List all doctors with optional filters
    searchDoctors: async ({ location, specialization, page = 1, limit = 20 } = {}) => {
        try {
            const params = new URLSearchParams();
            if (location) params.append('location', location);
            if (specialization) params.append('specialization', specialization);
            params.append('page', page);
            params.append('limit', limit);

            const url = `${API_URL}/doctor/list?${params.toString()}`;

            // Try to get token, but don't fail if not authenticated
            let headers = {};
            try {
                const token = await getAuthToken();
                headers = { Authorization: `Bearer ${token}` };
            } catch (e) {
                console.log("Fetching doctors without authentication (public access)");
            }

            const response = await axios.get(url, { headers });
            console.log(`Found ${response.data?.length || 0} doctors (page ${page})`);
            return response.data;
        } catch (error) {
            console.error("Search Doctors Error:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
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
                console.log(`Fetching doctor ${id} with authentication`);
            } catch (e) {
                console.log(`Fetching doctor ${id} without authentication (public access)`);
            }

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
    },

    // ================================
    // 6. DOCTOR VERIFICATION
    // ================================

    // Upload education / merit documents for verification (accepts File array)
    uploadVerificationDocs: async (files) => {
        try {
            const token = await getAuthToken();
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            const response = await axios.post(
                `${API_URL}/doctor/upload-verification-docs`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        } catch (error) {
            console.error("Upload Verification Docs Error:", error);
            throw error;
        }
    },

    // Doctor calls this to submit their profile for admin review
    requestVerification: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(
                `${API_URL}/doctor/request-verification`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Request Verification Error:", error);
            throw error;
        }
    },

    // ================================
    // 7. ADMIN — Verification Management
    // ================================

    // List all doctors with status = 'pending'
    listPendingDoctors: async () => {
        try {
            const adminKey = sessionStorage.getItem('admin_auth') === 'true' ? 'admin123' : '';
            const response = await axios.get(`${API_URL}/admin/doctors/pending`, {
                headers: { 'X-Admin-Key': adminKey }
            });
            return response.data;
        } catch (error) {
            console.error("List Pending Doctors Error:", error);
            throw error;
        }
    },

    // List all doctors with status = 'verified'
    listVerifiedDoctors: async () => {
        try {
            const adminKey = sessionStorage.getItem('admin_auth') === 'true' ? 'admin123' : '';
            const response = await axios.get(`${API_URL}/admin/doctors/verified`, {
                headers: { 'X-Admin-Key': adminKey }
            });
            return response.data;
        } catch (error) {
            console.error("List Verified Doctors Error:", error);
            throw error;
        }
    },

    // Approve or reject a doctor  action: "approve" | "reject", note: string (required for reject)
    verifyDoctor: async (doctorId, action, note = "") => {
        try {
            const adminKey = sessionStorage.getItem('admin_auth') === 'true' ? 'admin123' : '';
            const response = await axios.patch(
                `${API_URL}/admin/doctors/${doctorId}/verify`,
                { action, note },
                { headers: { 'X-Admin-Key': adminKey } }
            );
            return response.data;
        } catch (error) {
            console.error("Verify Doctor Error:", error);
            throw error;
        }
    },
};