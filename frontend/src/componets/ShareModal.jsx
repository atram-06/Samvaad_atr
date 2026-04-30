import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import './ShareModal.css';
import { API_BASE_URL } from '../config/api';

const ShareModal = ({ isOpen, onClose, post }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchFollowersAndFollowing();
        }
    }, [isOpen]);

    const fetchFollowersAndFollowing = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/followers-following`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (targetUser) => {
        try {
            const token = localStorage.getItem('token');

            // First, create or get conversation with target user
            const convResponse = await fetch(`${API_BASE_URL}/messages/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId: targetUser.id })
            });

            if (!convResponse.ok) {
                throw new Error('Failed to create conversation');
            }

            const { conversationId } = await convResponse.json();

            // Send message with post link
            const messageResponse = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: `Check out this post: ${window.location.origin}/post/${post.id}`
                })
            });

            // Track share
            await fetch(`${API_BASE_URL}/posts/${post.id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId: targetUser.id })
            });

            if (messageResponse.ok) {
                alert(`Shared with ${targetUser.username}!`);
                onClose();
            }
        } catch (err) {
            console.error('Failed to share:', err);
            alert('Failed to share post');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h3>Share</h3>
                    <button className="share-close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="share-search">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="share-users-list">
                    {loading ? (
                        <div className="share-loading">Loading...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="share-empty">No users found</div>
                    ) : (
                        filteredUsers.map(user => (
                            <div key={user.id} className="share-user-item" onClick={() => handleShare(user)}>
                                <div className="share-user-avatar">
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.username} />
                                    ) : (
                                        <div className="share-avatar-placeholder">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="share-user-info">
                                    <div className="share-username">{user.username}</div>
                                    <div className="share-fullname">{user.fullname || user.username}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
