import React, { useEffect, useState } from 'react';
import './RightSidebar.css';
import { API_BASE_URL } from '../config/api';
import DefaultAvatar from './DefaultAvatar';

const RightSidebar = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Load current user
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) setUser(storedUser);
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
            localStorage.removeItem('user'); // Clear bad data
        }

        // Fetch suggestions
        const fetchSuggestions = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/users/suggested`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data); // API now returns isFollowing status
                }
            } catch (err) {
                console.error('Failed to fetch suggestions', err);
            }
        };

        fetchSuggestions();
    }, []);

    const handleFollow = async (targetId) => {
        // Optimistic update
        setSuggestions(prev => prev.map(u =>
            u.id === targetId ? { ...u, isFollowing: !u.isFollowing } : u
        ));

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/users/${targetId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to follow user:', err);
            // Rollback
            setSuggestions(prev => prev.map(u =>
                u.id === targetId ? { ...u, isFollowing: !u.isFollowing } : u
            ));
        }
    };

    return (
        <div className="right-sidebar">
            {/* User switch removed as per request */}
            <div className="suggestions-section">
                <div className="suggestions-header">
                    <span className="suggestions-title">Suggested for you</span>
                    <span className="see-all">See All</span>
                </div>

                {suggestions.map(user => (
                    <div className="suggestion-item" key={user.id}>
                        <div className="user-info">
                            {user.profilePic ? (
                                <img src={user.profilePic} alt={user.username} className="user-avatar-sm" />
                            ) : (
                                <DefaultAvatar size="sm" />
                            )}
                            <div className="user-details">
                                <span className="username">{user.username}</span>
                                <span className="suggestion-info">{user.fullname || 'Suggested for you'}</span>
                            </div>
                        </div>
                        <button
                            className={`action-link ${user.isFollowing ? 'following' : 'follow'}`}
                            onClick={() => handleFollow(user.id)}
                        >
                            {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RightSidebar;
