import React from 'react';
import './SkeletonPost.css';

const SkeletonPost = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-username"></div>
            </div>
            <div className="skeleton-media"></div>
            <div className="skeleton-footer">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
            </div>
        </div>
    );
};

export default SkeletonPost;
