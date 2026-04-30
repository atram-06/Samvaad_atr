import React from 'react';
import './Stories.css';

const Stories = () => {
    const stories = []; // Dummy data removed as requested

    return (
        <div className="stories-container">
            {stories.map(story => (
                <div className="story-item" key={story.id}>
                    <div className="story-ring">
                        <div className="story-avatar">
                            {/* Img placeholder */}
                        </div>
                    </div>
                    <span className="story-username">{story.username}</span>
                </div>
            ))}
        </div>
    );
};

export default Stories;
