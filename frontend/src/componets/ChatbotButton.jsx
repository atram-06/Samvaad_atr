import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatbotButton.css';

const ChatbotButton = () => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/chatbot');
    };

    return (
        <div
            className={`chatbot-float-button ${isHovered ? 'hovered' : ''}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Chat with AI Assistant"
        >
            <div className="chatbot-float-icon">
                {isHovered ? '💬' : '🤖'}
            </div>
            {isHovered && (
                <div className="chatbot-float-tooltip">
                    Chat with AI
                </div>
            )}
        </div>
    );
};

export default ChatbotButton;
