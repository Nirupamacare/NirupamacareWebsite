import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DoctorCard from './DoctorCard';
import { api } from '../api'; // ✅ Use your centralized API file
import './Doctors.css';

const Doctors = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get initial values from URL
    const initialLocation = searchParams.get('location') || '';
    const initialSpec = searchParams.get('specialization') || '';

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const PAGE_LIMIT = 10;

    // Local state for the input fields
    const [filters, setFilters] = useState({
        location: initialLocation,
        specialization: initialSpec
    });

    // Client-side Filter States
    const [filterPrice, setFilterPrice] = useState(3000);
    const [filterRating, setFilterRating] = useState(0);
    const [sortBy, setSortBy] = useState('none');

    // Sync local state with URL params if they change externally (e.g. back button)
    useEffect(() => {
        setFilters({
            location: searchParams.get('location') || '',
            specialization: searchParams.get('specialization') || ''
        });
        setCurrentPage(1);
        fetchDoctors(1);
    }, [searchParams]);

    const fetchDoctors = async (page = 1) => {
        setLoading(true);
        try {
            const currentParams = new URLSearchParams(window.location.search);
            const location = currentParams.get('location') || '';
            const specialization = currentParams.get('specialization') || '';

            const data = await api.searchDoctors({ location, specialization, page, limit: PAGE_LIMIT });

            if (Array.isArray(data)) {
                setDoctors(data);
                setHasMore(data.length === PAGE_LIMIT); // if full page returned, likely more exist
            } else {
                console.warn("Unexpected response format:", data);
                setDoctors([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
            setDoctors([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (filters.location) params.append('location', filters.location);
        if (filters.specialization) params.append('specialization', filters.specialization);

        // Pushing to history triggers the useEffect above
        navigate(`/doctors?${params.toString()}`);
    };

    // --- Filter & Sort Logic ---
    const getFilteredDoctors = () => {
        let result = [...doctors];

        // 1. Price Filter (Show doctors where price <= filterPrice)
        // We check both clinic and online price. if either is within range, show it.
        result = result.filter(doc => {
            const pClinic = doc.price_clinic || 0;
            const pOnline = doc.price_online || 0;
            // If no price set, treat as 0 (free/negotiable) or filter out? 
            // Usually treating as 0 means it passes filter. 
            // If strictly ensuring valid price:
            const effectivePrice = Math.min(pClinic || 99999, pOnline || 99999);
            return effectivePrice <= filterPrice;
        });

        // 2. Rating Filter
        if (filterRating > 0) {
            result = result.filter(doc => (doc.rating || 0) >= filterRating);
        }

        // 3. Sorting
        if (sortBy === 'price_low') {
            result.sort((a, b) => {
                const pa = Math.min(a.price_clinic || 99999, a.price_online || 99999);
                const pb = Math.min(b.price_clinic || 99999, b.price_online || 99999);
                return pa - pb;
            });
        } else if (sortBy === 'price_high') {
            result.sort((a, b) => {
                const pa = Math.max(a.price_clinic || 0, a.price_online || 0);
                const pb = Math.max(b.price_clinic || 0, b.price_online || 0);
                return pb - pa;
            });
        } else if (sortBy === 'rating') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return result;
    };

    const displayDoctors = getFilteredDoctors();

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

            <div className="doctors-content">
                {/* --- Sidebar Filters --- */}
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <h3>Filters</h3>
                    </div>

                    <div className="filter-group">
                        <label>Max Price: ₹{filterPrice}</label>
                        <input
                            type="range"
                            min="0"
                            max="5000"
                            step="100"
                            value={filterPrice}
                            onChange={(e) => setFilterPrice(Number(e.target.value))}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Min Rating</label>
                        <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}>
                            <option value="0">Any Rating</option>
                            <option value="3">3+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="none">Relevance</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="rating">Rating: High to Low</option>
                        </select>
                    </div>
                </aside>

                <div className="doctors-grid">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading doctors...</p>
                        </div>
                    ) : (
                        <>
                            {displayDoctors.length > 0 ? (
                                displayDoctors.map(doc => (
                                    <DoctorCard key={doc.id || doc._id} doctor={doc} />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <h3>No doctors found matching filters.</h3>
                                    <p>Try adjusting your search criteria.</p>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {(currentPage > 1 || hasMore) && (
                                <div className="pagination-controls">
                                    <button
                                        className="btn-page"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const newPage = currentPage - 1;
                                            setCurrentPage(newPage);
                                            fetchDoctors(newPage);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                    <span className="page-indicator">Page {currentPage}</span>
                                    <button
                                        className="btn-page"
                                        disabled={!hasMore}
                                        onClick={() => {
                                            const newPage = currentPage + 1;
                                            setCurrentPage(newPage);
                                            fetchDoctors(newPage);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Doctors;