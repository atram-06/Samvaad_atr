import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api';
import { FiHome, FiSearch, FiCompass, FiMessageSquare, FiHeart, FiSettings, FiMenu } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggleCreatePost, onToggleSearch, onToggleNotifications }) => {
    const { theme, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const socket = useSocket();

    useEffect(() => {
        fetchUnreadCount();
        fetchUnreadMessageCount();
        if (socket) {
            socket.on('notification:count:update', ({ count }) => setUnreadCount(count));
            socket.on('notification:new', () => fetchUnreadCount());
            socket.on('new_message', () => fetchUnreadMessageCount());
            socket.on('message:count:update', ({ count }) => setUnreadMessageCount(count));
        }
        return () => {
            if (socket) {
                socket.off('notification:count:update');
                socket.off('notification:new');
                socket.off('new_message');
                socket.off('message:count:update');
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
            console.error('Failed to fetch notification count:', err);
        }
    };

    const fetchUnreadMessageCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadMessageCount(data.count);
            }
        } catch (err) {
            console.error('Failed to fetch message count:', err);
        }
    };

    return (
        <aside className={`sidebar ${collapsed ? 'narrow' : ''}`}>
            <div className="sidebar-top">
                <div className="sidebar-spacer" style={{ height: '20px' }}></div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <FiHome className="sidebar-icon" />
                        <span className="sidebar-text">Home</span>
                    </NavLink>
                    <button className="sidebar-link" onClick={onToggleSearch}>
                        <FiSearch className="sidebar-icon" />
                        <span className="sidebar-text">Search</span>
                    </button>
                    <NavLink to="/explore" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <FiCompass className="sidebar-icon" />
                        <span className="sidebar-text">Explore</span>
                    </NavLink>
                    <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <div className="icon-wrapper">
                            <FiMessageSquare className="sidebar-icon" />
                            {unreadMessageCount > 0 && (
                                <span className="sidebar-badge">
                                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                </span>
                            )}
                        </div>
                        <span className="sidebar-text">Messages</span>
                    </NavLink>
                    <Link to="/settings" className="sidebar-link">
                        <FiSettings className="sidebar-icon" size={24} />
                        <span className="sidebar-text">Settings</span>
                    </Link>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
