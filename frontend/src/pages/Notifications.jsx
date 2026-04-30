import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        fetchNotifications();
        markAsRead();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('notification', (newNotification) => {
                setNotifications(prev => [newNotification, ...prev]);
            });
        }
        return () => {
            if (socket) socket.off('notification');
        };
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

    return (
        <div className="notifications-container">
            <h2>Notifications</h2>
            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                        <div key={notif.id || index} className={`notification-item ${notif.read ? '' : 'unread'}`}>
                            <div className="notification-content">
                                {notif.type === 'like' && <span className="icon">❤️</span>}
                                {notif.type === 'comment' && <span className="icon">💬</span>}
                                {notif.type === 'follow' && <span className="icon">👤</span>}
                                {notif.type === 'message' && <span className="icon">📩</span>}
                                <span className="message">
                                    {notif.data && notif.data.username ? <strong>{notif.data.username}</strong> : ''}
                                    {notif.message || (notif.type === 'like' ? ' liked your post' : notif.type === 'comment' ? ' commented on your post' : notif.type === 'follow' ? ' started following you' : '')}
                                </span>
                            </div>
                            <span className="time">{new Date(notif.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                    ))
                ) : (
                    <p>No notifications yet.</p>
                )}
            </div>
        </div>
    );
};

export default Notifications;
