import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiShare2, FiArrowLeft, FiMusic, FiBookmark } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import DefaultAvatar from '../components/DefaultAvatar';
import './FullView.css';

const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
};

const FullViewItem = ({ item, isActive }) => {
    const videoRef = useRef(null);
    const [isLiked, setIsLiked] = useState(item.isLiked);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);
    const [isSaved, setIsSaved] = useState(item.isSaved);

    useEffect(() => {
        if ((item.mediaType === 'video' || item.type === 'video') && videoRef.current) {
            if (isActive) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(e => console.log('Autoplay error:', e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, item.mediaType, item.type]);

    const handleLike = async () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/posts/${item.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            setIsLiked(!newLiked);
            setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
        }
    };

    const handleSave = async () => {
        const newSaved = !isSaved;
        setIsSaved(newSaved);

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/posts/${item.id}/save`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            setIsSaved(!newSaved);
        }
    };

    return (
        <div className="full-view-item">
            {item.category === 'blog' ? (
                <div className="full-view-media blog-container">
                    <div className="blog-content">
                        <h2>{item.caption}</h2>
                    </div>
                </div>
            ) : (item.mediaType === 'video' || item.type === 'video') ? (
                <video
                    ref={videoRef}
                    src={getMediaUrl(item.mediaUrl)}
                    className="full-view-media video"
                    loop
                    muted={false}
                    playsInline
                    controls={false}
                    onClick={(e) => e.target.paused ? e.target.play() : e.target.pause()}
                />
            ) : (
                <img src={getMediaUrl(item.mediaUrl)} alt="Post" className="full-view-media" />
            )}

            {/* Info Overlay */}
            <div className="full-view-info">
                <div className="info-user-row">
                    {item.User && item.User.profilePic ? (
                        <img src={item.User.profilePic} alt={item.User.username} className="info-avatar" />
                    ) : (
                        <DefaultAvatar size="sm" />
                    )}
                    <span className="info-username">@{item.User ? item.User.username : 'unknown'}</span>
                </div>
                {item.category !== 'blog' && <p className="info-caption">{item.caption}</p>}
                {(item.mediaType === 'video' || item.type === 'video') && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                        <FiMusic /> Original Audio
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="full-view-overlay">
                <button className="action-button" onClick={handleLike}>
                    <FiHeart className="action-icon" fill={isLiked ? "red" : "none"} color={isLiked ? "red" : "white"} />
                    <span className="action-count">{likesCount}</span>
                </button>
                <button className="action-button">
                    <FiMessageCircle className="action-icon" />
                    <span className="action-count">{item.commentsCount || 0}</span>
                </button>
                <button className="action-button" onClick={handleSave}>
                    <FiBookmark className="action-icon" fill={isSaved ? "white" : "none"} />
                </button>
                <button className="action-button">
                    <FiShare2 className="action-icon" />
                    <span className="action-count">Share</span>
                </button>
            </div>
        </div>
    );
};

const FullView = () => {
    const navigate = useNavigate();
    const { postId } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPosts([data]); // For now, just show the single post
                }
            } catch (err) {
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    useEffect(() => {
        const options = {
            root: containerRef.current,
            threshold: 0.6,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    setActiveIndex(index);
                }
            });
        }, options);

        const elements = document.querySelectorAll('.full-view-item-wrapper');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [posts]);

    if (loading) return <div className="full-view-loading">Loading...</div>;
    if (posts.length === 0) return <div className="full-view-error">Post not found</div>;

    return (
        <div className="full-view-container" ref={containerRef}>
            <button className="back-button" onClick={() => navigate(-1)}>
                <FiArrowLeft size={24} />
            </button>

            {posts.map((item, index) => (
                <div key={item.id} className="full-view-item-wrapper" data-index={index}>
                    <FullViewItem item={item} isActive={index === activeIndex} />
                </div>
            ))}
        </div>
    );
};

export default FullView;
