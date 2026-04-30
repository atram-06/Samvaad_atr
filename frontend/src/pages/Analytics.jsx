import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_BASE_URL } from '../config/api';
import './Analytics.css';

const Analytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState({
        summary: {
            totalLikes: 0,
            totalComments: 0,
            totalViews: 0,
            totalPosts: 0
        },
        dailyData: []
    });
    const [days, setDays] = useState(7);

    useEffect(() => {
        fetchAnalytics();
    }, [days]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/analytics/posts?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAnalyticsData(data);
            } else {
                console.error('Failed to fetch analytics');
                // Set empty data on error
                setAnalyticsData({
                    summary: { totalLikes: 0, totalComments: 0, totalViews: 0, totalPosts: 0 },
                    dailyData: []
                });
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setAnalyticsData({
                summary: { totalLikes: 0, totalComments: 0, totalViews: 0, totalPosts: 0 },
                dailyData: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Memoize chart data to avoid unnecessary recalculations
    const chartData = useMemo(() => {
        const allDays = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Format day name based on range
            let dayName;
            if (days === 7) {
                // Show full day names for 7-day view
                dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                // Show date for 30-day view
                dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            // Find data for this date
            const dayData = analyticsData.dailyData.find(item => item.date === dateStr);

            allDays.push({
                name: dayName,
                date: dateStr,
                likes: dayData ? dayData.likes : 0,
                comments: dayData ? dayData.comments : 0,
                shares: dayData ? dayData.shares : 0,
                engagement: dayData ? (dayData.likes + dayData.comments) : 0
            });
        }

        return allDays;
    }, [analyticsData.dailyData, days]);

    // Calculate max values for Y-axis domain
    const maxLikes = useMemo(() => Math.max(...chartData.map(d => d.likes), 1), [chartData]);
    const maxComments = useMemo(() => Math.max(...chartData.map(d => d.comments), 1), [chartData]);
    const maxEngagement = useMemo(() => Math.max(...chartData.map(d => d.engagement), 1), [chartData]);

    // Calculate average engagement
    const avgEngagement = useMemo(() => {
        if (analyticsData.summary.totalPosts > 0) {
            return ((analyticsData.summary.totalLikes + analyticsData.summary.totalComments) / analyticsData.summary.totalPosts).toFixed(1);
        }
        return '0';
    }, [analyticsData.summary]);

    if (loading) {
        return (
            <div className="analytics-loading">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div className="analytics-title-row">
                    <button className="back-arrow" onClick={() => navigate('/settings')} aria-label="Back to Settings">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="analytics-title">Creator Dashboard</h1>
                </div>
                <p className="analytics-subtitle">Track your performance over the last {days} days</p>
                <div className="time-range-selector">
                    <button
                        className={`range-btn ${days === 7 ? 'active' : ''}`}
                        onClick={() => setDays(7)}
                        disabled={loading}
                    >
                        7 Days
                    </button>
                    <button
                        className={`range-btn ${days === 30 ? 'active' : ''}`}
                        onClick={() => setDays(30)}
                        disabled={loading}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="stats-summary">
                <div className="stat-item">
                    <div className="stat-value">{analyticsData.summary.totalLikes.toLocaleString()}</div>
                    <div className="stat-label">Total Likes</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{analyticsData.summary.totalComments.toLocaleString()}</div>
                    <div className="stat-label">Total Comments</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{analyticsData.summary.totalPosts}</div>
                    <div className="stat-label">Total Posts</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{avgEngagement}</div>
                    <div className="stat-label">Avg Engagement</div>
                </div>
            </div>

            {/* Charts */}
            {chartData.length > 0 ? (
                <div className="analytics-grid">
                    {/* Likes Chart */}
                    <div className="analytics-card">
                        <h3 className="card-title">Likes Over Time</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        interval={days === 30 ? 4 : 0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        domain={[0, maxLikes + 1]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--sidebar-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#0095f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#0095f6', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comments Chart */}
                    <div className="analytics-card">
                        <h3 className="card-title">Comments Over Time</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        interval={days === 30 ? 4 : 0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        domain={[0, maxComments + 1]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--sidebar-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="comments"
                                        stroke="#00c676"
                                        fill="#00c676"
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Chart */}
                    <div className="analytics-card">
                        <h3 className="card-title">Daily Engagement</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        interval={days === 30 ? 4 : 0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        domain={[0, maxEngagement + 1]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--sidebar-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="engagement"
                                        fill="#ff4081"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-data">
                    <p>No analytics data available yet. Start posting to see your insights!</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
