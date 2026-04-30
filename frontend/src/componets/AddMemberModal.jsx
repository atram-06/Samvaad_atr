import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { FiX, FiSearch, FiUsers } from 'react-icons/fi';
import './AddMemberModal.css';

const AddMemberModal = ({ isOpen, onClose, conversationId, existingMemberIds, onMembersAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch followers/following as potential group members
            const res = await fetch(`${API_BASE_URL}/users/followers-following`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out users who are already members
                if (Array.isArray(data)) {
                    const availableUsers = data.filter(user => !existingMemberIds.includes(user.id));
                    setAllUsers(availableUsers);
                } else {
                    console.error('Unexpected data format:', data);
                    setAllUsers([]);
                }
            } else {
                // Fallback: try to get users via search
                const searchRes = await fetch(`${API_BASE_URL}/users/search?q=a`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    const availableUsers = searchData.filter(user => !existingMemberIds.includes(user.id));
                    setAllUsers(availableUsers);
                }
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) {
            alert('Please select at least one member');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/groups/${conversationId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    memberIds: selectedUsers
                })
            });

            if (res.ok) {
                onMembersAdded();
                handleClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add members');
            }
        } catch (err) {
            console.error('Add members error:', err);
            alert('Failed to add members');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSelectedUsers([]);
        onClose();
    };

    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.fullname && user.fullname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}></div>
            <div className="add-member-modal">
                <div className="modal-header">
                    <h2>Add Members</h2>
                    <FiX className="close-icon" onClick={handleClose} />
                </div>

                <div className="modal-body">
                    <div className="section-header">
                        <span>Select Members</span>
                        <span className="member-count">{selectedUsers.length} selected</span>
                    </div>

                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="users-list">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="user-item"
                                    onClick={() => toggleUser(user.id)}
                                >
                                    <div className="user-avatar">
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.username} />
                                        ) : (
                                            <FiUsers />
                                        )}
                                    </div>
                                    <div className="user-info">
                                        <div className="username">{user.username}</div>
                                        <div className="user-email">{user.email || user.fullname}</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => { }}
                                        className="user-checkbox"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="no-users">
                                <p>No users available to add</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={handleClose}>Cancel</button>
                    <button
                        className="btn-create"
                        onClick={handleAddMembers}
                        disabled={loading || selectedUsers.length === 0}
                    >
                        {loading ? 'Adding...' : `Add ${selectedUsers.length > 0 ? selectedUsers.length : ''} Member${selectedUsers.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AddMemberModal;
