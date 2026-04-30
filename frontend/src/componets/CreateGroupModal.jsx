import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { FiX, FiSearch, FiUsers } from 'react-icons/fi';
import './CreateGroupModal.css';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
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
                // API returns a flat array of users already deduplicated
                if (Array.isArray(data)) {
                    setAllUsers(data);
                } else {
                    console.error('Unexpected data format:', data);
                    setAllUsers([]);
                }
            } else {
                // Fallback: try to get users via search with a wildcard
                const searchRes = await fetch(`${API_BASE_URL}/users/search?q=a`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    setAllUsers(searchData);
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

    const handleCreate = async () => {
        if (!groupName.trim()) {
            alert('Please enter a group name');
            return;
        }
        if (selectedUsers.length === 0) {
            alert('Please select at least one member');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    groupName: groupName.trim(),
                    memberIds: selectedUsers
                })
            });

            if (res.ok) {
                const data = await res.json();
                onGroupCreated(data.conversation);
                handleClose();
            } else {
                alert('Failed to create group');
            }
        } catch (err) {
            console.error('Create group error:', err);
            alert('Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setGroupName('');
        setSearchQuery('');
        setSelectedUsers([]);
        onClose();
    };

    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}></div>
            <div className="create-group-modal">
                <div className="modal-header">
                    <h2>New Group</h2>
                    <FiX className="close-icon" onClick={handleClose} />
                </div>

                <div className="modal-body">
                    <div className="group-name-section">
                        <input
                            type="text"
                            placeholder="Group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="group-name-input"
                            maxLength={50}
                        />
                    </div>

                    <div className="members-section">
                        <div className="section-header">
                            <span>Add Members</span>
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
                            {filteredUsers.map(user => (
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
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => { }}
                                        className="user-checkbox"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={handleClose}>Cancel</button>
                    <button
                        className="btn-create"
                        onClick={handleCreate}
                        disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateGroupModal;
