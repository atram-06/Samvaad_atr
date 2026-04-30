import React, { useState, useEffect } from 'react';
import { FiVideo, FiMusic, FiFileText, FiImage } from 'react-icons/fi';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './Explore.css';
import { API_BASE_URL } from '../config/api';

const categories = ['For You', 'Videos', 'Music', 'Blogs'];

const Explore = () => {
    const [activeTab, setActiveTab] = useState('For You');
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/posts?category=${activeTab}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                }
            } catch (err) {
                console.error('Failed to fetch explore posts:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [activeTab]);

    return (
        <div className="explore-container">
            {/* Category Tabs */}
            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${activeTab === cat ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Posts Grid/List */}
            <div className="explore-content">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <LoadingSpinner />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="no-posts">
                        <p>No posts found in {activeTab}</p>
                    </div>
                ) : (
                    <div className="explore-posts-list">
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isVisible={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
