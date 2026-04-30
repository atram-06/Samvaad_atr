// Quick debug script to test message sending
// Open browser console and run this

console.log('=== Testing Message Send ===');

// Get socket from SocketContext
const socket = window.socket || io('http://localhost:3001', {
    auth: { token: localStorage.getItem('token') }
});

// Test message
socket.emit('message:new', {
    tempId: 'test-' + Date.now(),
    conversationId: null, // or your conversation ID
    receiverId: 2, // Change to actual receiver ID
    text: 'Test message from console'
}, (ack) => {
    console.log('Message acknowledgment:', ack);
    if (ack.error) {
        console.error('ERROR:', ack.error);
    } else {
        console.log('SUCCESS:', ack.data);
    }
});

// Listen for incoming messages
socket.on('message:new', (msg) => {
    console.log('Received message:', msg);
});

console.log('Test message sent. Check backend logs and wait for response.');
