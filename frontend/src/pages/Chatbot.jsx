import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './Chatbot.css';

const API_URL = API_BASE_URL;

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState({ news: [], ai: [], quick: [] });
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadChatHistory();
        loadSuggestions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/chatbot/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMessages(response.data.history);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const loadSuggestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/chatbot/suggestions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuggestions(response.data.suggestions);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    };

    const sendMessage = async (message = inputMessage) => {
        if (!message.trim()) return;

        const userMessage = {
            message: message.trim(),
            sender: 'user',
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setShowSuggestions(false);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/chatbot/message`,
                { message: message.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const botMessage = {
                    message: response.data.response,
                    sender: 'bot',
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                message: "Sorry, I'm having trouble responding right now. Please try again!",
                sender: 'bot',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        const messages = {
            'suggest': "What should I post today?",
            'trending': "What's trending right now?",
            'timing': "When is the best time to post?",
            'caption': "Give me some caption ideas",
            'grow': "How can I grow my audience?"
        };

        sendMessage(messages[action] || action);
    };

    const clearChat = async () => {
        if (!window.confirm('Clear all chat history?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/chatbot/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <div className="chatbot-header-info">
                    <div className="chatbot-avatar">🤖</div>
                    <div>
                        <h2>AI Friend</h2>
                        <p className="chatbot-status">Online • Ready to chat</p>
                    </div>
                </div>
                <button className="clear-chat-btn" onClick={clearChat} title="Clear chat">
                    🗑️
                </button>
            </div>

            <div className="chatbot-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <div className="welcome-icon">👋</div>
                        <h3>Hey there! I'm your friendly AI companion</h3>
                        <p>Let's chat about anything! I'm here to listen, talk, and be your friend. 😊</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        <div className="message-content">
                            <p>{msg.message}</p>
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="message bot">
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-container">
                <div className="chatbot-input-wrapper">
                    <input
                        type="text"
                        className="chatbot-input"
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={loading}
                    />
                    <button
                        className="send-btn"
                        onClick={() => sendMessage()}
                        disabled={loading || !inputMessage.trim()}
                    >
                        {loading ? '⏳' : '✈️'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
