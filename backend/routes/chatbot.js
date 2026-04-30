const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ChatbotConversation = require('../models/ChatbotConversation');
const chatbotService = require('../services/chatbotService');

// Security middleware
const { chatbotLimiter } = require('../middleware/rateLimiter');
const { chatbotMessageValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot - with rate limiting and validation
 */
router.post('/message', authenticateToken, chatbotLimiter, chatbotMessageValidation, asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;

    console.log(`[Chatbot] User ${userId} sent: "${message}"`);

    // Save user message
    await ChatbotConversation.create({
        userId,
        message: message.trim(),
        sender: 'user'
    });

    // Get conversation history for context (last 10 messages)
    const history = await ChatbotConversation.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 10
    });

    // Reverse to get chronological order
    const contextHistory = history.reverse();

    console.log(`[Chatbot] Context history length: ${contextHistory.length}`);
    if (contextHistory.length > 0) {
        console.log(`[Chatbot] Last message in context: "${contextHistory[contextHistory.length - 1].message}"`);
    }

    // Generate AI response with context
    const botResponse = await chatbotService.generateResponse(
        message.trim(),
        contextHistory
    );

    console.log(`[Chatbot] Bot response: "${botResponse}"`);

    // Save bot response
    const botMessage = await ChatbotConversation.create({
        userId,
        message: botResponse,
        sender: 'bot'
    });

    res.json({
        success: true,
        message: botMessage,
        response: botResponse
    });
}));

/**
 * GET /api/chatbot/history
 * Get conversation history
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        const history = await ChatbotConversation.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
            limit
        });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * DELETE /api/chatbot/clear
 * Clear chat history
 */
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await ChatbotConversation.destroy({
            where: { userId }
        });

        res.json({
            success: true,
            message: 'Chat history cleared'
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

module.exports = router;
