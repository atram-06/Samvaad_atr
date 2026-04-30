import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraModal from '../components/CameraModal';
import './Settings.css';
import { API_BASE_URL } from '../config/api';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('edit-profile');
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loginActivities, setLoginActivities] = useState([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Load current user data
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            setIsPrivate(storedUser.isPrivate || false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (imageUrl) => {
        setProfileImage(imageUrl);
    };

    const handleChangePassword = async () => {
        try {
            console.log('Starting password change...');
            console.log('Password data:', {
                hasOldPassword: !!passwordData.oldPassword,
                hasNewPassword: !!passwordData.newPassword,
                hasConfirmPassword: !!passwordData.confirmPassword
            });

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                alert('New passwords do not match');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                alert('New password must be at least 6 characters');
                return;
            }

            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);
            console.log('API URL:', `${API_BASE_URL}/auth/change-password`);

            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                alert('Password changed successfully!');
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(data.message || data.error || 'Failed to change password');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            alert(`Error changing password: ${err.message}`);
        }
    };

    const fetchLoginActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/login-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLoginActivities(data);
            }
        } catch (err) {
            console.error('Error fetching login activity:', err);
        }
    };

    const handlePrivacyToggle = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/privacy`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isPrivate: !isPrivate })
            });

            if (response.ok) {
                const data = await response.json();
                setIsPrivate(data.isPrivate);

                // Update user in localStorage
                const updatedUser = { ...user, isPrivate: data.isPrivate };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);

                alert('Privacy setting updated successfully');
            }
        } catch (err) {
            console.error('Error updating privacy:', err);
            alert('Failed to update privacy setting');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'edit-profile':
                return (
                    <div>
                        <h2 className="settings-header">Edit Profile</h2>

                        <div className="edit-profile-avatar-section">
                            <div className="edit-profile-avatar">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder"></div>
                                )}
                            </div>
                            <div className="edit-profile-actions">
                                <h3 className="username-display">{user?.username || 'username'}</h3>
                                <div className="photo-options">
                                    <label className="photo-option-btn">
                                        Change Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <button
                                        className="photo-option-btn camera-btn"
                                        onClick={() => setShowCameraModal(true)}
                                    >
                                        Take Photo
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Name</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="Name"
                                defaultValue={user?.fullname}
                                id="fullname-input"
                            />
                        </div>
                        <div className="settings-form-group">
                            <label className="settings-label">Username</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="Username"
                                defaultValue={user?.username}
                                id="username-input"
                            />
                        </div>
                        <div className="settings-form-group">
                            <label className="settings-label">Bio</label>
                            <textarea
                                className="settings-input"
                                placeholder="Bio"
                                style={{ height: '80px', resize: 'vertical' }}
                                defaultValue={user?.bio}
                                id="bio-input"
                            ></textarea>
                        </div>
                        <button className="settings-btn" onClick={async () => {
                            try {
                                const formData = new FormData();
                                const bio = document.getElementById('bio-input').value;
                                const fullname = document.getElementById('fullname-input').value;
                                const username = document.getElementById('username-input').value;

                                formData.append('bio', bio);
                                formData.append('fullname', fullname);
                                formData.append('username', username);

                                // If profileImage is a base64 string (from camera), convert to blob
                                if (profileImage && profileImage.startsWith('data:')) {
                                    const res = await fetch(profileImage);
                                    const blob = await res.blob();
                                    formData.append('profilePic', blob, 'camera-capture.jpg');
                                } else if (document.querySelector('input[type="file"]').files[0]) {
                                    // If file input has a file
                                    formData.append('profilePic', document.querySelector('input[type="file"]').files[0]);
                                }

                                const token = localStorage.getItem('token');
                                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: formData
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    localStorage.setItem('user', JSON.stringify(data.user));
                                    setUser(data.user);
                                    alert('Profile updated successfully');
                                } else {
                                    if (response.status === 401 || response.status === 403) {
                                        alert('Session expired. Please login again.');
                                        handleLogout();
                                        return;
                                    }
                                    const errorData = await response.json();
                                    console.error('Update failed:', errorData);
                                    alert(`Failed to update profile: ${errorData.message || response.statusText}`);
                                }
                            } catch (err) {
                                console.error('Error updating profile:', err);
                                alert(`Error updating profile: ${err.message}`);
                            }
                        }}>Submit</button>
                    </div>
                );
            case 'change-password':
                return (
                    <div>
                        <h2 className="settings-header">Change Password</h2>
                        <div className="settings-form-group">
                            <label className="settings-label">Old Password</label>
                            <input
                                type="password"
                                className="settings-input"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            />
                        </div>
                        <div className="settings-form-group">
                            <label className="settings-label">New Password</label>
                            <input
                                type="password"
                                className="settings-input"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="settings-form-group">
                            <label className="settings-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="settings-input"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button className="settings-btn" onClick={handleChangePassword}>Change Password</button>
                    </div>
                );
            case 'privacy-security':
                return (
                    <div>
                        <h2 className="settings-header">Privacy and Security</h2>
                        <div className="settings-form-group">
                            <div className="privacy-option">
                                <div className="privacy-info">
                                    <h3 className="privacy-title">Private Account</h3>
                                    <p className="privacy-description">
                                        When your account is private, only people you approve can see your photos and videos.
                                        Your existing followers won't be affected.
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={handlePrivacyToggle}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'login-activity':
                return (
                    <div>
                        <h2 className="settings-header">Login Activity</h2>
                        <p className="settings-subtitle">Review your recent login activity</p>
                        {loginActivities.length === 0 ? (
                            <div className="settings-info">
                                <button className="settings-btn" onClick={fetchLoginActivity}>Load Login Activity</button>
                            </div>
                        ) : (
                            <div className="login-activity-list">
                                {loginActivities.map((activity, index) => (
                                    <div key={activity.id} className="login-activity-item">
                                        <div className="activity-icon">
                                            <span>{activity.deviceType === 'Mobile' ? '📱' : '💻'}</span>
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-device">{activity.deviceType || 'Desktop'}</div>
                                            <div className="activity-time">
                                                {new Date(activity.loginTime).toLocaleString()}
                                            </div>
                                            {activity.location && (
                                                <div className="activity-location">{activity.location}</div>
                                            )}
                                        </div>
                                        {index === 0 && <span className="activity-badge">Active Now</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return <div>Select a setting</div>;
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-sidebar">
                <div
                    className={`settings-tab ${activeTab === 'edit-profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('edit-profile')}
                >
                    Edit Profile
                </div>
                <div
                    className={`settings-tab ${activeTab === 'change-password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('change-password')}
                >
                    Change Password
                </div>
                <div
                    className={`settings-tab ${activeTab === 'privacy-security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('privacy-security')}
                >
                    Privacy and Security
                </div>
                <div
                    className={`settings-tab ${activeTab === 'login-activity' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('login-activity');
                        fetchLoginActivity();
                    }}
                >
                    Login Activity
                </div>
                <div
                    className="settings-tab"
                    onClick={() => navigate('/analytics')}
                >
                    Analytics
                </div>
                <div
                    className="settings-tab"
                    onClick={() => navigate('/history')}
                >
                    History
                </div>
                <button className="settings-tab settings-btn logout" onClick={handleLogout}>
                    Log Out
                </button>
            </div>
            <div className="settings-content">
                {renderContent()}
            </div>
            <CameraModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
};

export default Settings;
