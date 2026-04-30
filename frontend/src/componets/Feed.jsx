import React, { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';
import Stories from './Stories';
import SkeletonPost from './SkeletonPost';
import LoadingSpinner from './LoadingSpinner';
import './Feed.css';

import { API_BASE_URL } from '../config/api';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullStartY = useRef(0);
    const containerRef = useRef(null);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]); // Set empty array on error
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            pullStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        const touchY = e.touches[0].clientY;
        const pullDistance = touchY - pullStartY.current;

        if (pullDistance > 50 && window.scrollY === 0 && !isRefreshing) {
            // Visual feedback could be added here
        }
    };

    const handleTouchEnd = (e) => {
        const touchY = e.changedTouches[0].clientY;
        const pullDistance = touchY - pullStartY.current;

        if (pullDistance > 80 && window.scrollY === 0 && !isRefreshing) {
            setIsRefreshing(true);
            fetchPosts();
        }
    };

    return (
        <div
            className="feed-container"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Stories removed as per request */}

            {isRefreshing && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                    <LoadingSpinner />
                </div>
            )}

            <div className="feed-posts">
                {isLoading ? (
                    <>
                        <SkeletonPost />
                        <SkeletonPost />
                        <SkeletonPost />
                    </>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#8e8e8e' }}>
                        No posts yet. Be the first to create one!
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isVisible={true}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Feed;
