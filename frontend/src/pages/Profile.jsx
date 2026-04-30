import React, { useState, useEffect } from 'react';
import { FiGrid, FiVideo, FiMusic, FiFileText, FiHeart, FiMessageCircle, FiTrash2, FiLock } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import PostCard from '../components/PostCard';
import './Profile.css';
import { API_BASE_URL } from '../config/api';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                const token = localStorage.getItem('token');

                if (!storedUser || !token) {
                    window.location.href = '/login';
                    return;
                }

                const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);

                    const postsRes = await fetch(`${API_BASE_URL}/posts/user/${userData.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (postsRes.ok) {
                        const postsData = await postsRes.json();
                        setPosts(postsData);
                    } else {
                        console.error('Failed to fetch posts:', postsRes.status);
                    }
                } else if (userRes.status === 401 || userRes.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                } else {
                    console.error('Failed to fetch user data');
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Debug: Log posts whenever they change
    useEffect(() => {
        if (posts.length > 0) {
            console.log('📊 Posts loaded:', posts.length);
            const categories = {};
            posts.forEach(p => {
                categories[p.category] = (categories[p.category] || 0) + 1;
            });
            console.log('📂 By category:', categories);
            console.log('🎵 Music posts:', posts.filter(p => p.category === 'music'));
        }
    }, [posts]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handlePostClick = (post) => {
        setSelectedPost(post);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closePostModal = () => {
        setSelectedPost(null);
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="profile-avatar-container">
                    {user.profilePic ? (
                        <img src={user.profilePic} alt="Profile" className="profile-avatar-img" />
                    ) : (
                        <DefaultAvatar size="xl" />
                    )}
                </div>

                <div className="profile-info">
                    <div className="profile-username-row">
                        <h2 className="profile-username">
                            {user.username}
                            {user.isPrivate && (
                                <FiLock
                                    size={18}
                                    style={{ marginLeft: '8px', color: '#8e8e8e' }}
                                    title="Private Account"
                                />
                            )}
                        </h2>
                        <button className="edit-profile-btn" onClick={() => window.location.href = '/settings'}>Edit Profile</button>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item"><span className="stat-value">{posts.length}</span> posts</div>
                        <div className="stat-item"><span className="stat-value">{user.followersCount || 0}</span> followers</div>
                        <div className="stat-item"><span className="stat-value">{user.followingCount || 0}</span> following</div>
                    </div>

                    <div className="profile-bio">
                        <div className="bio-fullname">{user.fullname || user.username}</div>
                        <div>{user.bio || 'Samvaad Creator 💬'}</div>
                    </div>
                </div>
            </header>

            <div className="profile-tabs">
                <div className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                    <FiGrid size={12} /> POSTS
                </div>
                <div className={`profile-tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
                    <FiVideo size={12} /> VIDEOS
                </div>
                <div className={`profile-tab ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}>
                    <FiMusic size={12} /> MUSIC
                </div>
                <div className={`profile-tab ${activeTab === 'blogs' ? 'active' : ''}`} onClick={() => setActiveTab('blogs')}>
                    <FiFileText size={12} /> BLOGS
                </div>
            </div>

            <div className="profile-grid">
                {(() => {
                    let filteredPosts = posts;
                    if (activeTab === 'videos') {
                        filteredPosts = posts.filter(p => p.category === 'video');
                    } else if (activeTab === 'music') {
                        filteredPosts = posts.filter(p => p.category === 'music');
                    } else if (activeTab === 'blogs') {
                        filteredPosts = posts.filter(p => p.category === 'blog');
                    } else if (activeTab === 'posts') {
                        filteredPosts = posts.filter(p => p.category === 'post' || !p.category);
                    }

                    if (filteredPosts.length === 0) {
                        return (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#8e8e8e' }}>
                                No {activeTab} yet. Share your first moment!
                            </div>
                        );
                    }

                    return filteredPosts.map(post => (
                        <div key={post.id} className="profile-post" onClick={() => handlePostClick(post)}>
                            {post.category === 'blog' ? (
                                <div className="profile-blog-preview">
                                    <p>{post.caption?.substring(0, 100)}...</p>
                                </div>
                            ) : post.category === 'music' ? (
                                <div className="profile-music-preview" style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
                                    color: 'white'
                                }}>
                                    <FiMusic size={48} style={{ marginBottom: '10px' }} />
                                    <audio src={post.mediaUrl} controls style={{ width: '90%', height: '30px' }} onClick={(e) => e.stopPropagation()} />
                                </div>
                            ) : post.mediaType === 'video' || post.category === 'video' ? (
                                <video src={post.mediaUrl} className="profile-post-img" />
                            ) : (
                                <img src={post.mediaUrl || 'https://placehold.co/300'} alt="Post" className="profile-post-img" />
                            )}
                            <div className="profile-post-overlay">
                                <div className="overlay-stat">
                                    <FiHeart fill="white" /> {post.likesCount || 0}
                                </div>
                                <div className="overlay-stat">
                                    <FiMessageCircle fill="white" /> {post.commentsCount || 0}
                                </div>
                            </div>
                            <button
                                className="profile-post-delete"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this post?')) {
                                        try {
                                            const token = localStorage.getItem('token');
                                            const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
                                                method: 'DELETE',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (response.ok) {
                                                setPosts(posts.filter(p => p.id !== post.id));
                                            }
                                        } catch (err) {
                                            console.error('Failed to delete post:', err);
                                        }
                                    }
                                }}
                                title="Delete post"
                            >
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    ));
                })()}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
                <div className="post-modal-overlay" onClick={closePostModal}>
                    <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="post-modal-close" onClick={closePostModal}>&times;</button>
                        <PostCard post={selectedPost} isVisible={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
