import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationsDrawer.css';
import { API_BASE_URL } from '../config/api';
import { useSocket } from '../context/SocketContext';
import { FiX } from 'react-icons/fi';
import useNotificationSound from '../hooks/useNotificationSound';

const NotificationsDrawer = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const socket = useSocket();
    const navigate = useNavigate();
    const { playSound, canPlaySound } = useNotificationSound();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            markAllAsRead();
        }
    }, [isOpen]);

    useEffect(() => {
        if (socket) {
            socket.on('notification:new', (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);

                // Play sound for message notifications
                if (newNotif.type === 'message' && canPlaySound) {
                    playSound();
                }
            });
        }
        return () => {
            if (socket) socket.off('notification:new');
        };
    }, [socket, canPlaySound, playSound]);

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

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

    const getNotificationText = (notif) => {
        switch (notif.type) {
            case 'like': return 'liked your post.';
            case 'comment': return `commented: "${notif.payload?.text || ''}"`;
            case 'follow': return 'started following you.';
            case 'message': return notif.payload?.text || 'sent you a message.';
            case 'mention': return 'mentioned you in a comment.';
            default: return 'interacted with you.';
        }
    };

    const handleNotificationClick = (notif) => {
        if (notif.type === 'message') {
            // Navigate to messages page
            navigate('/messages');
            onClose();
        }
        // Add other notification type handlers as needed
    };

    return (
        <>
            <div className={`notifications-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

            <div className={`notifications-drawer ${isOpen ? 'open' : ''}`}>
                <div className="notifications-header">
                    <span className="notifications-title">Notifications</span>
                    <FiX className="close-icon" onClick={onClose} style={{ cursor: 'pointer', marginLeft: 'auto' }} size={24} />
                </div>

                <div className="notifications-content">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div
                                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="notification-avatar">
                                    {notif.Actor?.profilePic ? (
                                        <img src={notif.Actor.profilePic} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ccc' }}></div>
                                    )}
                                </div>
                                <div className="notification-info">
                                    <span className="notification-username">{notif.Actor?.username}</span>
                                    <span className="notification-text"> {getNotificationText(notif)}</span>
                                    <span className="notification-time">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                <div className="notification-action">
                                    {notif.type === 'follow' ? (
                                        <button className="follow-btn">View</button>
                                    ) : notif.type === 'message' ? (
                                        <button
                                            className="view-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotificationClick(notif);
                                            }}
                                            style={{
                                                padding: '5px 12px',
                                                background: '#0095f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            View
                                        </button>
                                    ) : (
                                        notif.payload?.preview && (
                                            <img src={notif.payload.preview} alt="Post" className="post-thumb" />
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-notifications">
                            <p>No notifications yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationsDrawer;
