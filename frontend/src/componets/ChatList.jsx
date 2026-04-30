import React, { useState, useEffect } from 'react';
import { FiEdit, FiSearch, FiX, FiUsers } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api';
import CreateGroupModal from './CreateGroupModal';

const ChatList = ({ activeChatId, onSelectChat, onlineUsers, onInitialOnlineUsers }) => {
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const socket = useSocket();
    const user = JSON.parse(localStorage.getItem('user'));

    console.log('ChatList: Online users:', Array.from(onlineUsers));

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('message:new', (message) => {
                console.log('ChatList received message:', message);
                fetchConversations();
            });
        }
        return () => {
            if (socket) {
                socket.off('message:new');
            }
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');

            // Check if token exists
            if (!token) {
                console.error('No token found, redirecting to login');
                window.location.href = '/login';
                return;
            }

            const res = await fetch(`${API_BASE_URL}/chat/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle authentication errors
            if (res.status === 401 || res.status === 403) {
                console.error('Authentication failed: Token expired or invalid');
                // Clear localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirect to login
                window.location.href = '/login';
                return;
            }

            if (!res.ok) {
                throw new Error(`Failed to fetch conversations: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            console.log('Fetched conversations:', data);
            setChats(data);

            // Extract initial online status from the response
            const initialOnlineUsers = new Set();
            data.forEach(chat => {
                if (chat.user && chat.user.isOnline) {
                    initialOnlineUsers.add(chat.user.id);
                    console.log(`User ${chat.user.id} (${chat.user.username}) is online`);
                }
            });
            if (onInitialOnlineUsers) {
                onInitialOnlineUsers(initialOnlineUsers);
            }
            console.log('Initial online users:', Array.from(initialOnlineUsers));
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    };

    const filteredChats = chats.filter(chat => {
        if (chat.type === 'group') {
            return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return chat.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chat.user?.fullname && chat.user.fullname.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <span className="chat-list-username">{user?.username}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <FiUsers size={24} className="new-message-icon" onClick={() => setShowGroupModal(true)} title="New Group" />
                    <FiEdit size={24} className="new-message-icon" />
                </div>
            </div>

            <div className="chat-search-container">
                <div className={`chat-search-wrapper ${isFocused ? 'focused' : ''}`}>
                    <FiSearch className="chat-search-icon" style={{ color: 'var(--secondary-text)' }} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="chat-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {searchQuery && (
                        <FiX
                            className="chat-search-clear"
                            style={{ cursor: 'pointer', color: 'var(--secondary-text)' }}
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>

            <div className="chat-tabs">
                <div className="chat-tab active">Messages</div>
                <div className="chat-tab">Requests</div>
            </div>

            <div className="chat-list-scroll">
                {filteredChats.length > 0 ? (
                    filteredChats.map(chat => (
                        <div
                            key={chat.type === 'group' ? `group_${chat.conversationId}` : `direct_${chat.user.id}`}
                            className={`chat-item ${activeChatId === (chat.type === 'group' ? chat.conversationId : chat.user.id) ? 'active' : ''}`}
                            onClick={() => onSelectChat(chat)}
                        >
                            <div className="chat-avatar-container">
                                <div className="chat-avatar">
                                    {chat.type === 'group' ? (
                                        chat.groupIcon ? (
                                            <img src={chat.groupIcon} alt="group" />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#dbdbdb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FiUsers size={24} />
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            {chat.user.profilePic ? (
                                                <img src={chat.user.profilePic} alt="avatar" />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#dbdbdb' }}></div>
                                            )}
                                            {onlineUsers.has(chat.user.id) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '0',
                                                    right: '0',
                                                    width: '14px',
                                                    height: '14px',
                                                    backgroundColor: '#44b700',
                                                    border: '2px solid var(--bg-primary)',
                                                    borderRadius: '50%'
                                                }}></div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="chat-info">
                                <span className="chat-name">
                                    {chat.type === 'group' ? chat.groupName : chat.user.username}
                                </span>
                                <span className={`chat-preview-text ${chat.unreadCount > 0 ? 'unread' : ''}`}>
                                    {chat.lastMessage || 'Start a conversation'}
                                </span>
                                {chat.lastMessageAt && (
                                    <span className="chat-time">
                                        {' • ' + new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="unread-dot"></div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <p>No conversations found.</p>
                    </div>
                )}
            </div>

            <CreateGroupModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                onGroupCreated={(group) => {
                    setShowGroupModal(false);
                    fetchConversations();
                }}
            />
        </div>
    );
};

export default ChatList;
