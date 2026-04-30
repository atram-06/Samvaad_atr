import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Use relative URL if API_BASE_URL is relative, or absolute if needed.
            // API_BASE_URL is http://127.0.0.1:3002/api, we need http://127.0.0.1:3002
            const socketUrl = API_BASE_URL.replace('/api', '');

            const newSocket = io(socketUrl, {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            // Heartbeat to keep presence updated
            const heartbeatInterval = setInterval(() => {
                if (newSocket.connected) {
                    newSocket.emit('presence:heartbeat');
                }
            }, 30000); // Every 30 seconds

            setSocket(newSocket);

            return () => {
                clearInterval(heartbeatInterval);
                newSocket.disconnect();
            };
        }
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
