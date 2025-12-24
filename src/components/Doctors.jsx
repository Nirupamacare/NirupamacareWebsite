import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DoctorCard from './DoctorCard';
import './Doctors.css';

const Doctors = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get initial values from URL or default to empty
    const initialLocation = searchParams.get('location') || '';
    const initialSpec = searchParams.get('specialization') || '';

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        location: initialLocation,
        specialization: initialSpec
    });

    useEffect(() => {
        fetchDoctors();
    }, [searchParams]); // Refetch when URL params change

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            // Construct query string
            const params = new URLSearchParams();
            if (filters.location) params.append('location', filters.location);
            if (filters.specialization) params.append('specialization', filters.specialization);

            // Allow overrides from current state if URL didn't update yet (optional optimization)
            // But relying on URL is safer for deep linking. 
            // Here we prioritize the *logic* of fetching.
            // Let's use the URL params strictly for the fetch to ensure back-button works.
            const urlParams = new URLSearchParams(window.location.search);

            const response = await fetch(`http://localhost:5000/api/doctors?${urlParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                setDoctors(data.data);
            } else {
                setDoctors([]);
            }
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Update URL to trigger the useEffect
        const params = new URLSearchParams();
        if (filters.location) params.append('location', filters.location);
        if (filters.specialization) params.append('specialization', filters.specialization);
        navigate(`/doctors?${params.toString()}`);
    };

    return (
        <div className="doctors-page">
            <header className="docs-header">
                <h1>Find your Doctor</h1>
                <div className="docs-search-bar">
                    <input
                        type="text"
                        placeholder="Location (e.g. Kolkata)"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Specialization (e.g. Dentist)"
                        value={filters.specialization}
                        onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
            </header>

            <div className="doctors-grid">
                {loading ? (
                    <div className="loading-state">Loading doctors...</div>
                ) : (
                    <>
                        {doctors.length > 0 ? (
                            doctors.map(doc => (
                                <DoctorCard key={doc.id} doctor={doc} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <h3>No doctors found nearby.</h3>
                                <p>Try changing your location or filters.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Doctors;
