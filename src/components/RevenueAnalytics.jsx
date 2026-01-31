import React, { useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, CreditCard, PieChart } from 'lucide-react';

const RevenueAnalytics = ({ bookingHistory = [], doctorProfile }) => {
    const [timeFilter, setTimeFilter] = useState('7'); // '7' or '30' days

    // Logic: Process data
    const stats = useMemo(() => {
        if (!bookingHistory || bookingHistory.length === 0) return null;

        // Filter for completed or confirmed appointments to be generous with "revenue" visualization if testing
        const completedBookings = bookingHistory.filter(b =>
            b.status === 'completed' || b.status === 'Confirmed'
        );

        // Helper to determine fee
        const getFee = (booking) => {
            if (booking.fee !== undefined && booking.fee !== null) return booking.fee;
            if (!doctorProfile) return 0;

            const isOnline = booking.type && booking.type.toLowerCase().includes('online');
            // Backend models use price_online / price_clinic
            return isOnline ? (doctorProfile.price_online || 0) : (doctorProfile.price_clinic || 0);
        };

        const totalRevenue = completedBookings.reduce((sum, b) => sum + getFee(b), 0);
        const activePatients = new Set(completedBookings.map(b => b.patient_name || b.patientId)).size;

        const onlineRevenue = completedBookings
            .filter(b => b.type && b.type.toLowerCase().includes('online'))
            .reduce((sum, b) => sum + getFee(b), 0);

        const clinicRevenue = totalRevenue - onlineRevenue;
        const onlineMix = totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0;
        const clinicMix = totalRevenue > 0 ? (clinicRevenue / totalRevenue) * 100 : 0;

        // Aggregate by day for chart
        const daysToLookBack = parseInt(timeFilter);
        const chartDataMap = {};

        // Initialize last N days
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartDataMap[dateStr] = {
                date: dateStr,
                displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                online: 0,
                clinic: 0
            };
        }

        completedBookings.forEach(b => {
            const dateKey = b.date; // Assuming YYYY-MM-DD from backend
            if (chartDataMap[dateKey]) {
                const fee = getFee(b);
                if (b.type && b.type.toLowerCase().includes('online')) {
                    chartDataMap[dateKey].online += fee;
                } else {
                    chartDataMap[dateKey].clinic += fee;
                }
            }
        });

        const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalRevenue,
            activePatients,
            onlineMix: onlineMix.toFixed(1),
            clinicMix: clinicMix.toFixed(1),
            chartData
        };
    }, [bookingHistory, timeFilter, doctorProfile]);

    if (!bookingHistory || bookingHistory.length === 0) {
        return (
            <div className="ra-empty-state">
                <PieChart className="ra-empty-icon" />
                <h3 className="ra-empty-title">No data available</h3>
                <p className="ra-empty-desc">
                    Once you complete your first appointments, your revenue analytics will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="ra-container">
            <div className="ra-header-row">
                <div>
                    <h2 className="ra-title">Revenue & Analytics</h2>
                    <p className="ra-subtitle">Track your performance and patient volume</p>
                </div>

                <select
                    className="ra-filter-select"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                </select>
            </div>

            {/* Stats Grid */}
            <div className="ra-stats-grid">
                <div className="ra-card ra-stat-card">
                    <div className="ra-icon-box ra-icon-blue">
                        <CreditCard className="ra-icon text-blue" />
                    </div>
                    <div>
                        <p className="ra-stat-label">Total Revenue</p>
                        <h4 className="ra-stat-value">₹{stats?.totalRevenue.toLocaleString()}</h4>
                    </div>
                </div>

                <div className="ra-card ra-stat-card">
                    <div className="ra-icon-box ra-icon-teal">
                        <Users className="ra-icon text-teal" />
                    </div>
                    <div>
                        <p className="ra-stat-label">Active Patients</p>
                        <h4 className="ra-stat-value">{stats?.activePatients}</h4>
                    </div>
                </div>

                <div className="ra-card ra-mix-card">
                    <p className="ra-stat-label mb-2">Service Mix</p>
                    <div className="ra-mix-row">
                        <div className="ra-mix-item">
                            <span className="ra-mix-label">Online</span>
                            <span className="ra-mix-percent text-blue">{stats?.onlineMix}%</span>
                        </div>
                        <div className="ra-progress-bar">
                            <div
                                className="ra-progress-fill bg-blue"
                                style={{ width: `${stats?.onlineMix}%` }}
                            ></div>
                            <div
                                className="ra-progress-fill bg-teal"
                                style={{ width: `${stats?.clinicMix}%` }}
                            ></div>
                        </div>
                        <div className="ra-mix-item text-right">
                            <span className="ra-mix-label">Clinic</span>
                            <span className="ra-mix-percent text-teal">{stats?.clinicMix}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="ra-card ra-chart-card">
                <h3 className="ra-chart-title">Revenue Trend</h3>
                <div className="ra-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`₹${value}`, '']}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="monotone"
                                dataKey="online"
                                name="Online Revenue"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="clinic"
                                name="Clinic Revenue"
                                stroke="#14b8a6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default RevenueAnalytics;
