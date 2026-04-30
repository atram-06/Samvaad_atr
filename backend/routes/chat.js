const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sanitizeUploadParams } = require('../middleware/uploadSanitizer');
const leftListService = require('../services/leftListService');
const chatService = require('../services/chatService');
const PresenceService = require('../services/presenceService');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage: storage });

// Upload media
router.post('/upload', authenticateToken, sanitizeUploadParams, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path, type: req.file.mimetype });
});

// Get Left List with online status
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const list = await leftListService.getLeftList(req.user.id);

        // Get online status for users in direct chats only (not groups)
        const userIds = list
            .filter(item => item.type === 'direct' && item.user)
            .map(item => item.user.id);

        if (userIds.length > 0) {
            try {
                const onlineStatusMap = await PresenceService.getOnlineStatusMap(userIds);
                // Add online status to each user in direct chats
                list.forEach(item => {
                    if (item.type === 'direct' && item.user) {
                        item.user.isOnline = onlineStatusMap[item.user.id] || false;
                    }
                });
            } catch (presenceErr) {
                console.warn('Could not fetch presence status:', presenceErr.message);
                // Continue without presence data
            }
        }

        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chat list' });
    }
});

// Get Messages for Conversation
router.get('/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const messages = await chatService.getMessages(conversationId, parseInt(limit), parseInt(offset));
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

module.exports = router;
