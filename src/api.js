import axios from 'axios';
import { auth } from './firebase'; 
import { onAuthStateChanged } from "firebase/auth"; 

const API_URL = "https://api-48aa.vercel.app/v1";

// Helper: Get Token robustly
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
    // --- 1. Authentication ---
    authenticate: async (firebaseToken, formData = {}) => {
        try {
            const payload = {
                role_request: "patient_free", 
                first_name: formData.fullName ? formData.fullName.split(' ')[0] : undefined,
                last_name: formData.fullName ? formData.fullName.split(' ').slice(1).join(' ') : undefined,
            };
            const response = await axios.post(`${API_URL}/auth/register`, payload, {
                headers: { Authorization: `Bearer ${firebaseToken}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // --- 2. Create Profile (POST) ---
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

    // --- 3. Fetch Profile (GET) - THIS WAS MISSING ---
    getPatientProfile: async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(
                `${API_URL}/patient/profile`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            // It's okay if this fails for new users (404), we just log it
            console.log("Could not fetch profile (User might be new or network error)");
            throw error;
        }
    }
};