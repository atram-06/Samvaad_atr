import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('liked');
    const [likedPosts, setLikedPosts] = useState([]);
    const [commentedPosts, setCommentedPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/history/${activeTab}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (activeTab === 'liked') setLikedPosts(data);
                else if (activeTab === 'commented') setCommentedPosts(data);
                else if (activeTab === 'saved') setSavedPosts(data);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPosts = () => {
        if (activeTab === 'liked') return likedPosts;
        if (activeTab === 'commented') return commentedPosts;
        return savedPosts;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL.replace('/api', '')}${url}`;
    };

    const posts = getCurrentPosts();

    return (
        <div className="history-container">
            <div className="history-header">
                <div className="history-title-row">
                    <button className="back-arrow" onClick={() => navigate('/settings')} aria-label="Back to Settings">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="history-title">Your Activity</h1>
                </div>

                <div className="history-tabs">
                    <button
                        className={`history-tab ${activeTab === 'liked' ? 'active' : ''}`}
                        onClick={() => setActiveTab('liked')}
                    >
                        Liked Posts
                    </button>
                    <button
                        className={`history-tab ${activeTab === 'commented' ? 'active' : ''}`}
                        onClick={() => setActiveTab('commented')}
                    >
                        Commented Posts
                    </button>
                    <button
                        className={`history-tab ${activeTab === 'saved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('saved')}
                    >
                        Saved Posts
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="history-loading">Loading...</div>
            ) : posts.length > 0 ? (
                <div className="history-grid">
                    {posts.map((post) => (
                        <div key={post.id} className="history-post-card" onClick={() => navigate(`/post/${post.id}`)}>
                            <div className="history-post-image">
                                {post.category === 'blog' ? (
                                    <div className="history-blog-preview">
                                        <p>{post.caption}</p>
                                    </div>
                                ) : post.mediaType === 'video' || post.type === 'video' ? (
                                    <video
                                        src={getMediaUrl(post.mediaUrl)}
                                        muted
                                        playsInline
                                        onMouseOver={e => e.target.play()}
                                        onMouseOut={e => {
                                            e.target.pause();
                                            e.target.currentTime = 0;
                                        }}
                                    />
                                ) : (
                                    <img src={getMediaUrl(post.mediaUrl) || '/placeholder.jpg'} alt="Post" />
                                )}
                            </div>
                            <div className="history-post-info">
                                <div className="history-post-user">
                                    <img
                                        src={post.User?.profilePic || '/default-avatar.png'}
                                        alt={post.User?.username}
                                        className="history-user-avatar"
                                    />
                                    <span className="history-username">{post.User?.username}</span>
                                </div>
                                <div className="history-post-time">
                                    {activeTab === 'liked' && formatDate(post.likedAt)}
                                    {activeTab === 'commented' && (
                                        <>
                                            <div>{formatDate(post.commentedAt)}</div>
                                            {post.lastComment && (
                                                <div className="last-comment">"{post.lastComment.substring(0, 50)}..."</div>
                                            )}
                                        </>
                                    )}
                                    {activeTab === 'saved' && formatDate(post.savedAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="history-empty">
                    <p>No {activeTab} posts yet</p>
                </div>
            )}
        </div>
    );
};

export default History;
