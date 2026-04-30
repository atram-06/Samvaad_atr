import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api';
import { FiPlusSquare, FiBell, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ onToggleNotifications, onToggleCreatePost }) => {
    const { theme, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const socket = useSocket();

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
    }

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('notification:count:update', (data) => {
                setUnreadCount(data.count);
            });

            // Also listen for new notifications to increment if count update not sent
            socket.on('notification:new', () => {
                // Ideally, backend sends count update too.
                // But we can also increment locally or re-fetch.
                // Let's re-fetch to be safe.
                fetchUnreadCount();
            });
        }
        return () => {
            if (socket) {
                socket.off('notification:count:update');
                socket.off('notification:new');
            }
        };
    }, [socket]);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (err) {
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src="/samvaad-logo.jpg" alt="Samvaad Logo" className="navbar-logo-img" />
                <Link to="/" className="navbar-brand">Samvaad</Link>
            </div>

            <div className="navbar-right">
                <button className="nav-icon-btn" title="Switch Appearance" onClick={toggleTheme}>
                    {theme === 'light' ? <FiMoon /> : <FiSun />}
                </button>
                <button className="nav-icon-btn create-btn" title="Create" onClick={onToggleCreatePost}>
                    <FiPlusSquare />
                    <span>Create</span>
                </button>
                <button className="nav-icon-btn notification-btn" title="Notifications" onClick={onToggleNotifications}>
                    <FiBell />
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
                <Link to="/profile" className="nav-icon-btn profile-icon" title="Profile">
                    {user && user.profilePic ? (
                        <img src={user.profilePic} alt={user.username} className="nav-profile-img" />
                    ) : (
                        <FiUser />
                    )}
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
