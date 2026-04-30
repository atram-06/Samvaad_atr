import React, { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import './Messages.css';

const Messages = () => {
    const [activeChat, setActiveChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const socket = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('presence:update', (data) => {
                console.log('Messages: Presence update received:', data);
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    if (data.status === 'online') {
                        newSet.add(data.userId);
                    } else {
                        newSet.delete(data.userId);
                    }
                    return newSet;
                });
            });
        }
        return () => {
            if (socket) {
                socket.off('presence:update');
            }
        };
    }, [socket]);

    const handleChatUpdated = (updatedChat) => {
        setActiveChat(prev => {
            if (!prev) return prev;

            // Handle group chats
            if (prev.type === 'group' && updatedChat.type === 'group') {
                if (prev.conversationId === updatedChat.conversationId || prev.id === updatedChat.id) {
                    return { ...prev, ...updatedChat };
                }
            }

            // Handle direct chats
            if (prev.type !== 'group' && updatedChat.type !== 'group') {
                if (prev.user && updatedChat.user && prev.user.id === updatedChat.user.id) {
                    return { ...prev, ...updatedChat };
                }
            }

            return prev;
        });
    };

    const handleInitialOnlineUsers = (users) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            users.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    return (
        <div className={`messages-container ${activeChat ? 'chat-active' : ''}`}>
            <ChatList
                activeChatId={activeChat?.type === 'group' ? (activeChat?.conversationId || activeChat?.id) : activeChat?.user?.id}
                onSelectChat={setActiveChat}
                onlineUsers={onlineUsers}
                onInitialOnlineUsers={handleInitialOnlineUsers}
            />
            <ChatWindow
                chat={activeChat}
                onBack={() => setActiveChat(null)}
                onChatUpdated={handleChatUpdated}
                onlineUsers={onlineUsers}
            />
        </div>
    );
};

export default Messages;
