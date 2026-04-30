import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import { FiX, FiUsers, FiUserPlus, FiLogOut, FiCamera } from 'react-icons/fi';
import AddMemberModal from './AddMemberModal';
import './GroupInfoDrawer.css';

const GroupInfoDrawer = ({ isOpen, onClose, conversationId, onGroupUpdated }) => {
    const [groupInfo, setGroupInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

    useEffect(() => {
        if (isOpen && conversationId) {
            fetchGroupInfo();
        }
    }, [isOpen, conversationId]);

    const fetchGroupInfo = async () => {
        if (!conversationId) {
            console.error('No conversationId provided to GroupInfoDrawer');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/groups/${conversationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGroupInfo(data);
                // Notify parent component of updated group info
                if (onGroupUpdated) {
                    onGroupUpdated(data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch group info:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/groups/${conversationId}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Left group successfully');
                onClose();
                window.location.reload(); // Refresh to update chat list
            }
        } catch (err) {
            console.error('Failed to leave group:', err);
            alert('Failed to leave group');
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/groups/${conversationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Group deleted successfully');
                onClose();
                window.location.reload(); // Refresh to update chat list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete group');
            }
        } catch (err) {
            console.error('Failed to delete group:', err);
            alert('Failed to delete group');
        }
    };

    const handleAddMembers = () => {
        setShowAddMemberModal(true);
    };

    const handleMembersAdded = () => {
        // Refresh group info after adding members
        fetchGroupInfo();
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploadingPhoto(true);
        try {
            const token = localStorage.getItem('token');

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${API_BASE_URL}/chat/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload image');
            }

            const uploadData = await uploadRes.json();

            // Update group info with new photo
            const updateRes = await fetch(`${API_BASE_URL}/groups/${conversationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    groupIcon: uploadData.url
                })
            });

            if (updateRes.ok) {
                // Refresh group info to show new photo
                await fetchGroupInfo();
                // Also reload the page to update chat list
                window.location.reload();
            } else {
                const data = await updateRes.json();
                alert(data.error || 'Failed to update group photo');
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const isAdmin = groupInfo?.members?.find(m => m.userId === currentUserId)?.role === 'admin';

    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose}></div>
            <div className={`group-info-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Group Info</h2>
                    <FiX className="close-icon" onClick={onClose} />
                </div>

                {loading ? (
                    <div className="drawer-loading">Loading...</div>
                ) : groupInfo ? (
                    <div className="drawer-content">
                        <div className="group-header-section">
                            <div className="group-icon-large" onClick={isAdmin ? () => fileInputRef.current?.click() : undefined} style={{ cursor: isAdmin ? 'pointer' : 'default', position: 'relative' }}>
                                {groupInfo.groupIcon ? (
                                    <img src={groupInfo.groupIcon} alt={groupInfo.groupName} />
                                ) : (
                                    <FiUsers size={48} />
                                )}
                                {isAdmin && (
                                    <div className="photo-upload-overlay">
                                        <FiCamera size={24} />
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            )}
                            <h3 className="group-name-large">{groupInfo.groupName}</h3>
                            <p className="group-member-count">{groupInfo.memberCount} members</p>
                            {uploadingPhoto && <p className="uploading-text">Uploading photo...</p>}
                        </div>

                        <div className="members-section">
                            <div className="section-title">
                                <span>Members</span>
                                {isAdmin && (
                                    <button className="add-member-btn" onClick={handleAddMembers}>
                                        <FiUserPlus /> Add
                                    </button>
                                )}
                            </div>

                            <div className="members-list">
                                {groupInfo.members?.map(member => (
                                    <div key={member.userId} className="member-item">
                                        <div className="member-avatar">
                                            {member.user?.profilePic ? (
                                                <img src={member.user.profilePic} alt={member.user.username} />
                                            ) : (
                                                <FiUsers />
                                            )}
                                        </div>
                                        <div className="member-info">
                                            <div className="member-name">{member.user?.username}</div>
                                            {member.role === 'admin' && (
                                                <span className="admin-badge">Admin</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="actions-section">
                            <button className="leave-group-btn" onClick={handleLeaveGroup}>
                                <FiLogOut /> Leave Group
                            </button>
                            {isAdmin && (
                                <button className="delete-group-btn" onClick={handleDeleteGroup}>
                                    Delete Group
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="drawer-error">Failed to load group info</div>
                )}
            </div>

            <AddMemberModal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                conversationId={conversationId}
                existingMemberIds={groupInfo?.members?.map(m => m.userId) || []}
                onMembersAdded={handleMembersAdded}
            />
        </>
    );
};

export default GroupInfoDrawer;
