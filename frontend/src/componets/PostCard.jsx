import React, { useState, useRef, useEffect } from 'react';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
import ShareModal from './ShareModal';
import DefaultAvatar from './DefaultAvatar';
import './PostCard.css';
import { API_BASE_URL } from '../config/api';

const PostCard = ({ post, innerRef, isVisible }) => {
    const videoRef = useRef(null);
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [isSaved, setIsSaved] = useState(post.isSaved);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isOwner = currentUser && post.User && currentUser.id === post.User.id;

    useEffect(() => {
        if (isVisible) {
            if (post.type === 'video' && videoRef.current) {
                videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
            }
        } else {
            if (post.type === 'video' && videoRef.current) {
                videoRef.current.pause();
            }
        }
    }, [isVisible, post.type]);

    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleLike = async () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            setIsLiked(!newLiked);
            setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
            console.error('Failed to like post:', err);
        }
    };

    const handleSave = async () => {
        const newSaved = !isSaved;
        setIsSaved(newSaved);

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/posts/${post.id}/save`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            setIsSaved(!newSaved);
            console.error('Failed to save post:', err);
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            try {
                const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`);
                if (response.ok) {
                    const data = await response.json();
                    setComments(data);
                }
            } catch (err) {
                console.error('Failed to fetch comments:', err);
            }
        }
        setShowComments(!showComments);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: commentText })
            });

            if (response.ok) {
                const newComment = await response.json();
                setComments([...comments, newComment]);
                setCommentsCount(prev => prev + 1);
                setCommentText('');
            }
        } catch (err) {
            console.error('Failed to post comment:', err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setComments(comments.filter(c => c.id !== commentId));
                setCommentsCount(prev => prev - 1);
            }
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to delete post:', err);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL.replace('/api', '')}${url}`;
    };

    return (
        <div className="post-card" ref={innerRef}>
            <div className="post-header">
                <div className="post-user-info">
                    {post.User && post.User.profilePic ? (
                        <img src={post.User.profilePic} alt={post.User.username} className="post-avatar-img" />
                    ) : (
                        <DefaultAvatar size="sm" />
                    )}
                    <span className="post-username">{post.User ? post.User.username : 'Unknown'}</span>
                    <span className="post-time">• {formatTimestamp(post.createdAt)}</span>
                </div>
                {isOwner && (
                    <button className="post-options" onClick={handleDelete} title="Delete Post">
                        <FiMoreHorizontal />
                    </button>
                )}
            </div>

            <div className="post-media">
                {post.category === 'blog' ? (
                    <div className="blog-content-card">
                        <p className="blog-text">{post.caption}</p>
                    </div>
                ) : (
                    <>
                        {post.mediaType === 'video' || post.type === 'video' ? (
                            <video
                                ref={videoRef}
                                src={getMediaUrl(post.mediaUrl)}
                                className="post-img"
                                muted
                                loop
                                playsInline
                                controls
                            />
                        ) : post.mediaType === 'audio' || (post.mediaUrl && (
                            post.mediaUrl.endsWith('.mp3') ||
                            post.mediaUrl.endsWith('.wav') ||
                            post.mediaUrl.endsWith('.m4a') ||
                            post.mediaUrl.endsWith('.aac')
                        )) ? (
                            <div className="audio-player-container">
                                <audio
                                    src={getMediaUrl(post.mediaUrl)}
                                    controls
                                    className="post-audio"
                                />
                            </div>
                        ) : (
                            <img
                                src={getMediaUrl(post.mediaUrl)}
                                alt="Post"
                                className="post-img"
                            />
                        )}
                    </>
                )}
            </div>

            <div className="post-footer">
                <div className="post-actions">
                    <div className="action-btn-group">
                        <button className="action-btn" onClick={handleLike}>
                            <FiHeart fill={isLiked ? "red" : "none"} color={isLiked ? "red" : "currentColor"} />
                        </button>
                        <button className="action-btn" onClick={toggleComments}><FiMessageCircle /></button>
                        <button className="action-btn" onClick={() => setShowShareModal(true)}><FiSend /></button>
                    </div>
                    <button className="action-btn" onClick={handleSave}>
                        <FiBookmark fill={isSaved ? "black" : "none"} color="currentColor" />
                    </button>
                </div>

                <span className="post-likes">{likesCount} likes</span>

                {post.category !== 'blog' && (
                    <div className="post-caption">
                        <span className="caption-username">{post.User ? post.User.username : 'Unknown'}</span>
                        {post.caption}
                    </div>
                )}

                {commentsCount > 0 && !showComments && (
                    <button className="view-comments-btn" onClick={toggleComments}>
                        View all {commentsCount} comments
                    </button>
                )}

                {showComments && (
                    <div className="comments-section">
                        {comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-content">
                                    {comment.User && comment.User.profilePic ? (
                                        <img src={comment.User.profilePic} alt={comment.User.username} className="comment-avatar" />
                                    ) : (
                                        <DefaultAvatar size="sm" />
                                    )}
                                    <div className="comment-text-wrapper">
                                        <span className="comment-username">{comment.User ? comment.User.username : 'User'}</span>
                                        <span className="comment-text">{comment.text}</span>
                                    </div>
                                </div>
                                {currentUser && comment.User && currentUser.id === comment.User.id && (
                                    <button
                                        className="delete-comment-btn"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        title="Delete comment"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="comment-input"
                            />
                            <button type="submit" className="post-comment-btn" disabled={!commentText.trim()}>Post</button>
                        </form>
                    </div>
                )}
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                post={post}
            />
        </div>
    );
};

export default PostCard;
