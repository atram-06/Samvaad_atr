const axios = require('axios');

class ChatbotService {
    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    }

    /**
     * Generate a friendly response using Mistral AI
     */
    async generateResponse(userMessage, conversationHistory = []) {
        try {
            console.log('[ChatbotService] Generating response for:', userMessage);
            console.log('[ChatbotService] History length:', conversationHistory.length);

            if (!this.apiKey) {
                console.warn('[ChatbotService] MISTRAL_API_KEY not configured, using fallback responses');
                return this.getFallbackResponse(userMessage);
            }

            // Build conversation messages for Mistral
            const messages = this.buildMessages(conversationHistory, userMessage);
            console.log('[ChatbotService] Built messages count:', messages.length);

            console.log('[ChatbotService] Calling Mistral AI...');

            const response = await axios.post(
                this.apiUrl,
                {
                    model: 'mistral-tiny', // Free tier model
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 200
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            const botResponse = response.data.choices[0].message.content.trim();
            console.log('[ChatbotService] Mistral response:', botResponse);

            return botResponse;
        } catch (error) {
            console.error('[ChatbotService] Error generating AI response:', error.message);
            if (error.response) {
                console.error('[ChatbotService] API Error:', error.response.data);
            }
            return this.getFallbackResponse(userMessage);
        }
    }

    /**
     * Build messages array for Mistral API
     */
    buildMessages(conversationHistory, currentMessage) {
        const messages = [];

        // System message with personality
        messages.push({
            role: 'system',
            content: `You are a friendly AI companion who loves chatting with people.
Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Your personality:
- Warm, caring, and genuinely interested in the conversation
- Chat naturally like a close friend would
- Use casual, friendly language
- Add emojis occasionally to show emotion (but keep it natural)
- Be supportive and encouraging
- Keep responses conversational (2-4 sentences)
- Ask questions to keep the conversation going
- Show empathy and understanding
- Be fun, lighthearted, and positive
- Talk about anything - life, feelings, interests, random thoughts
- IMPORTANT: Stay on topic and respond directly to what the user just said`
        });

        // Add conversation history (last 8 messages for context)
        const recentHistory = conversationHistory.slice(-8);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message
            });
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: currentMessage
        });

        return messages;
    }

    /**
     * Fallback responses when AI is not available
     */
    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Greeting
        if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            return `${greeting}! 👋 So good to see you! How are you doing today?`;
        }

        // How are you
        if (lowerMessage.includes('how are you') || lowerMessage.includes('how r u')) {
            return "I'm doing great, thanks for asking! 😊 How about you? What's been going on?";
        }

        // Thanks
        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return "You're so welcome! 🥰 Anytime, friend! What else is on your mind?";
        }

        // Feelings
        if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('upset')) {
            return "Aww, I'm sorry you're feeling down. 💙 Want to talk about it? I'm here to listen.";
        }

        if (lowerMessage.includes('happy') || lowerMessage.includes('excited') || lowerMessage.includes('great')) {
            return "That's awesome! 🎉 I love your positive energy! What's making you so happy?";
        }

        // Help
        if (lowerMessage.includes('help')) {
            return "I'm here for you! 😊 What's going on? You can talk to me about anything!";
        }

        // Default - friendly and engaging
        const friendlyResponses = [
            "That's interesting! 😊 Tell me more about that!",
            "I hear you! 💭 What made you think of that?",
            "Oh really? That's cool! ✨ How do you feel about it?",
            "Hmm, interesting point! 🤔 What else is on your mind?",
            "I get what you mean! Want to chat more about it?",
            "That's a good one! 👍 What do you think about it?"
        ];
        return friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
    }
}

module.exports = new ChatbotService();
