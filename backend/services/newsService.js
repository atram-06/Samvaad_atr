const axios = require('axios');

class NewsService {
    constructor() {
        this.apiKey = process.env.NEWS_API_KEY;
        this.baseUrl = 'https://newsapi.org/v2';
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 3600000 // 1 hour cache
        };
    }

    /**
     * Fetch top headlines from NewsAPI
     */
    async getTopHeadlines(category = 'general', country = 'us') {
        try {
            // Check cache first
            if (this.isCacheValid()) {
                return this.cache.data;
            }

            if (!this.apiKey) {
                console.warn('NEWS_API_KEY not configured, returning mock data');
                return this.getMockNews();
            }

            const response = await axios.get(`${this.baseUrl}/top-headlines`, {
                params: {
                    apiKey: this.apiKey,
                    category,
                    country,
                    pageSize: 10
                }
            });

            const articles = response.data.articles || [];

            // Cache the results
            this.cache.data = articles;
            this.cache.timestamp = Date.now();

            return articles;
        } catch (error) {
            console.error('Error fetching news:', error.message);
            return this.getMockNews();
        }
    }

    /**
     * Get trending topics from multiple categories
     */
    async getTrendingTopics() {
        try {
            const categories = ['technology', 'sports', 'entertainment', 'health'];
            const headlines = await this.getTopHeadlines('general');

            // Extract trending topics from headlines
            const topics = headlines.slice(0, 5).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                category: 'trending'
            }));

            return topics;
        } catch (error) {
            console.error('Error getting trending topics:', error.message);
            return [];
        }
    }

    /**
     * Search news by keyword
     */
    async searchNews(query) {
        try {
            if (!this.apiKey) {
                return this.getMockNews();
            }

            const response = await axios.get(`${this.baseUrl}/everything`, {
                params: {
                    apiKey: this.apiKey,
                    q: query,
                    sortBy: 'publishedAt',
                    pageSize: 5
                }
            });

            return response.data.articles || [];
        } catch (error) {
            console.error('Error searching news:', error.message);
            return [];
        }
    }

    /**
     * Get content suggestions based on news
     */
    async getContentSuggestions() {
        try {
            const headlines = await this.getTopHeadlines();

            const suggestions = headlines.slice(0, 5).map(article => {
                const title = article.title.split(' - ')[0]; // Remove source from title

                return {
                    type: 'news',
                    topic: title,
                    description: article.description,
                    suggestion: this.generateSuggestion(title, article.description),
                    source: article.source.name,
                    url: article.url,
                    publishedAt: article.publishedAt
                };
            });

            return suggestions;
        } catch (error) {
            console.error('Error generating content suggestions:', error.message);
            return [];
        }
    }

    /**
     * Generate a content suggestion based on news
     */
    generateSuggestion(title, description) {
        const templates = [
            `Share your thoughts on: "${title}"`,
            `What's your take on ${title}? Your followers would love to hear!`,
            `Trending now: ${title}. Create a post about this!`,
            `Hot topic alert! Post about: ${title}`,
            `Everyone's talking about ${title}. Join the conversation!`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        if (!this.cache.data || !this.cache.timestamp) {
            return false;
        }
        return (Date.now() - this.cache.timestamp) < this.cache.ttl;
    }

    /**
     * Get mock news data for testing
     */
    getMockNews() {
        return [
            {
                title: 'AI Technology Breakthrough in 2025',
                description: 'New AI models are revolutionizing how we interact with technology.',
                source: { name: 'Tech News' },
                url: 'https://example.com',
                publishedAt: new Date().toISOString()
            },
            {
                title: 'Climate Summit Announces Major Initiatives',
                description: 'World leaders commit to ambitious climate goals.',
                source: { name: 'World News' },
                url: 'https://example.com',
                publishedAt: new Date().toISOString()
            },
            {
                title: 'Sports Championship Finals This Weekend',
                description: 'Exciting matches expected as teams compete for the title.',
                source: { name: 'Sports Daily' },
                url: 'https://example.com',
                publishedAt: new Date().toISOString()
            }
        ];
    }
}

module.exports = new NewsService();
