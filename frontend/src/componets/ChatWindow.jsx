import React, { useState, useEffect, useRef } from 'react';
import { FiInfo, FiSmile, FiImage, FiHeart, FiArrowLeft, FiSend, FiPhone, FiVideo, FiMic, FiX, FiUsers } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api';
import GroupInfoDrawer from './GroupInfoDrawer';

const ChatWindow = ({ chat, onBack, onChatUpdated, onlineUsers }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const socket = useSocket();
    const user = JSON.parse(localStorage.getItem('user'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chat && chat.conversationId) {
            fetchMessages();
            markMessagesAsRead();
        } else {
            setMessages([]);
        }
        setShowEmojiPicker(false);
    }, [chat]);

    useEffect(() => {
        if (chat && onlineUsers && chat.type !== 'group') {
            setIsOnline(onlineUsers.has(chat.user?.id));
        }
    }, [chat, onlineUsers]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (socket && chat) {
            if (chat.conversationId) {
                socket.emit('conversation:join', chat.conversationId);
            }

            const handleNewMessage = (message) => {
                const isRelevant = (
                    message.conversationId === chat.conversationId ||
                    (message.senderId === chat.user?.id && message.receiverId === user.id) ||
                    (message.senderId === user.id && message.receiverId === chat.user?.id)
                );

                if (isRelevant) {
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === message.id);
                        if (exists) return prev;
                        return [...prev, message];
                    });

                    // Mark messages as read if this is the active conversation
                    if (message.senderId !== user.id && chat.conversationId) {
                        markMessagesAsRead();
                    }
                }

                setIsTyping(false);

                if (message.senderId !== user.id) {
                    socket.emit('message:read', {
                        messageId: message.id,
                        conversationId: message.conversationId,
                        senderId: message.senderId
                    });
                }

                if (!chat.conversationId && message.conversationId && onChatUpdated) {
                    onChatUpdated({ ...chat, conversationId: message.conversationId });
                    socket.emit('conversation:join', message.conversationId);
                }
            };

            socket.on('message:new', handleNewMessage);
            socket.on('message:read', (receipt) => {
                setMessages(prev => prev.map(msg =>
                    msg.id === receipt.messageId ? { ...msg, status: 'read', readAt: receipt.readAt } : msg
                ));
            });

            socket.on('typing:start', (data) => {
                if (data.conversationId === chat.conversationId && data.userId !== user.id) {
                    setIsTyping(true);
                }
            });

            socket.on('typing:stop', (data) => {
                if (data.conversationId === chat.conversationId && data.userId !== user.id) {
                    setIsTyping(false);
                }
            });
        }

        return () => {
            if (socket && chat) {
                if (chat.conversationId) {
                    socket.emit('conversation:leave', chat.conversationId);
                }
                socket.off('message:new');
                socket.off('message:read');
                socket.off('typing:start');
                socket.off('typing:stop');
            }
        };
    }, [socket, chat]);

    const fetchMessages = async () => {
        if (!chat.conversationId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/chat/${chat.conversationId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch messages');

            const data = await res.json();
            setMessages(data.reverse());
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const markMessagesAsRead = async () => {
        if (!chat.conversationId) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/messages/conversations/${chat.conversationId}/mark-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';

        if (socket && chat.conversationId && chat.type !== 'group') {
            socket.emit('typing:start', {
                conversationId: chat.conversationId,
                receiverId: chat.user?.id
            });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing:stop', {
                    conversationId: chat.conversationId,
                    receiverId: chat.user?.id
                });
            }, 2000);
        }
    };

    const sendMessage = (text, mediaUrl = null, mediaType = null) => {
        if (!text && !mediaUrl) return;

        const tempId = 'temp-' + Date.now();

        if (socket) {
            if (chat.type !== 'group') {
                socket.emit('typing:stop', {
                    conversationId: chat.conversationId,
                    receiverId: chat.user?.id
                });
            }

            const payload = {
                tempId,
                conversationId: chat.conversationId,
                receiverId: chat.user?.id,
                text,
                mediaUrl,
                mediaType
            };

            socket.emit('message:new', payload, (ack) => {
                if (ack && ack.data) {
                    // Don't add message here - it will be added via message:new socket event
                    // This prevents duplicate messages

                    // Only update conversation ID if it's a new conversation
                    if (!chat.conversationId && ack.data.conversationId && onChatUpdated) {
                        onChatUpdated({ ...chat, conversationId: ack.data.conversationId });
                    }
                }
            });
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessage(newMessage);
        setNewMessage('');
        setIsTyping(false);
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/chat/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                sendMessage(null, data.url, data.type.startsWith('video') ? 'video' : 'image');
            }
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    const handleLike = () => {
        sendMessage('❤️');
    };

    const handleMic = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
            }, 2000);
        }
    };

    const handleGroupUpdated = (updatedGroupInfo) => {
        // Update the chat object with new member count and group info
        if (onChatUpdated && chat) {
            onChatUpdated({
                ...chat,
                memberCount: updatedGroupInfo.memberCount,
                groupIcon: updatedGroupInfo.groupIcon,
                groupName: updatedGroupInfo.groupName
            });
        }
    };

    if (!chat) {
        return (
            <div className="chat-window-container empty-chat-state">
                <div className="empty-icon-wrapper">
                    <FiSend size={48} style={{ marginLeft: '5px' }} />
                </div>
                <h3 className="empty-title">Your Messages</h3>
                <p style={{ color: 'var(--secondary-text)', marginBottom: '20px' }}>Send private photos and messages to a friend or group.</p>
                <button className="empty-btn">Send Message</button>
            </div>
        );
    }

    return (
        <div className="chat-window-container">
            <div className="chat-window-header">
                <button className="back-btn" onClick={onBack}>
                    <FiArrowLeft size={24} />
                </button>
                <div className="chat-header-avatar">
                    {chat.type === 'group' ? (
                        chat.groupIcon ? (
                            <img src={chat.groupIcon} alt="group" />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#dbdbdb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                <FiUsers size={20} />
                            </div>
                        )
                    ) : (
                        <>
                            {chat.user?.profilePic ? (
                                <img src={chat.user.profilePic} alt="avatar" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#dbdbdb' }}></div>
                            )}
                            {isOnline && <div className="online-dot-header"></div>}
                        </>
                    )}
                </div>
                <div className="chat-header-info">
                    <span className="chat-window-username">
                        {chat.type === 'group' ? chat.groupName : chat.user?.username}
                    </span>
                    <span className="chat-window-status">
                        {chat.type === 'group' ? (
                            `${chat.memberCount || 0} members`
                        ) : (
                            isTyping ? <span style={{ color: '#0095f6', fontWeight: 'bold' }}>Typing...</span> : (isOnline ? 'Active now' : 'Offline')
                        )}
                    </span>
                </div>
                <div className="chat-header-actions">
                    {chat.type === 'group' && (
                        <FiInfo size={24} onClick={() => setShowGroupInfo(true)} style={{ cursor: 'pointer' }} />
                    )}
                </div>
            </div>

            <div className="chat-messages-area">
                {messages.map((msg, index) => {
                    const isSent = msg.senderId === user.id;
                    const messageDate = new Date(msg.createdAt);
                    const timeDisplay = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let showDateHeader = false;
                    let dateHeaderText = '';

                    if (index === 0) {
                        showDateHeader = true;
                    } else {
                        const prevMsgDate = new Date(messages[index - 1].createdAt);
                        if (prevMsgDate.toDateString() !== messageDate.toDateString()) {
                            showDateHeader = true;
                        }
                    }

                    if (showDateHeader) {
                        const now = new Date();
                        const isToday = messageDate.toDateString() === now.toDateString();
                        const isYesterday = new Date(now - 86400000).toDateString() === messageDate.toDateString();

                        if (isToday) dateHeaderText = 'Today';
                        else if (isYesterday) dateHeaderText = 'Yesterday';
                        else dateHeaderText = messageDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                    }

                    return (
                        <React.Fragment key={`msg_${msg.id}_${msg.senderId}_${index}`}>
                            {showDateHeader && (
                                <div className="date-header">
                                    <span>{dateHeaderText}</span>
                                </div>
                            )}
                            <div className={`message-row ${isSent ? 'sent' : 'received'}`}>
                                {!isSent && (
                                    <div className="message-avatar">
                                        {msg.Sender?.profilePic || chat.user?.profilePic ? (
                                            <img src={msg.Sender?.profilePic || chat.user?.profilePic} alt={msg.Sender?.username || chat.user?.username} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#dbdbdb', borderRadius: '50%' }}></div>
                                        )}
                                    </div>
                                )}
                                <div className="message-content">
                                    {chat.type === 'group' && !isSent && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                                            {msg.Sender?.username}
                                        </div>
                                    )}
                                    <div className="message-bubble">
                                        {msg.mediaUrl && (
                                            msg.mediaType === 'video' ? (
                                                <video src={msg.mediaUrl} controls className="message-media" />
                                            ) : (
                                                <img src={msg.mediaUrl} alt="attachment" className="message-media" />
                                            )
                                        )}
                                        {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
                                    </div>
                                    <span className="message-timestamp" title={messageDate.toLocaleString()}>
                                        {timeDisplay}
                                        {isSent && msg.status === 'read' && ' • Read'}
                                    </span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                {isTyping && chat.type !== 'group' && (
                    <div className="message-row received">
                        <div className="message-avatar">
                            {chat.user?.profilePic ? (
                                <img src={chat.user.profilePic} alt={chat.user.username} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#dbdbdb', borderRadius: '50%' }}></div>
                            )}
                        </div>
                        <div className="message-content">
                            <div className="message-bubble typing-bubble">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {showEmojiPicker && (
                <div className="emoji-picker-container">
                    <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} theme="dark" />
                </div>
            )}

            <form className="chat-input-area" onSubmit={handleSend}>
                <div className="chat-input-wrapper">
                    <button
                        type="button"
                        className="chat-action-btn"
                        aria-label="Choose emoji"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <FiSmile size={24} />
                    </button>
                    <textarea
                        className="chat-input"
                        placeholder="Message..."
                        aria-label="Type a message"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        rows={1}
                    />
                    {newMessage && (
                        <button type="submit" className="chat-send-btn" aria-label="Send message">Send</button>
                    )}
                </div>

                {!newMessage && (
                    <div className="chat-input-actions">
                        <button
                            type="button"
                            className="chat-action-btn"
                            aria-label="Voice message"
                            onClick={handleMic}
                            style={{ color: isRecording ? 'red' : 'inherit' }}
                        >
                            <FiMic size={24} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*,video/*"
                            onChange={handleImageUpload}
                        />
                        <button
                            type="button"
                            className="chat-action-btn"
                            aria-label="Attach image"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FiImage size={24} />
                        </button>
                        <button
                            type="button"
                            className="chat-action-btn"
                            aria-label="Like"
                            onClick={handleLike}
                        >
                            <FiHeart size={24} />
                        </button>
                    </div>
                )}
            </form>

            <GroupInfoDrawer
                isOpen={showGroupInfo}
                onClose={() => setShowGroupInfo(false)}
                conversationId={chat.conversationId || chat.id}
                onGroupUpdated={handleGroupUpdated}
            />
        </div>
    );
};

export default ChatWindow;
