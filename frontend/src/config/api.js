// Configuration for API endpoints
// Ready for future FastAPI integration

export const API_CONFIG = {
    // Backend runs on 8000 by default (via uvicorn app:app --reload)
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://tripsync-ai.onrender.com',

    ENDPOINTS: {
        RECOMMEND: '/plan',
        DESTINATIONS: '/destinations',
        SEARCH: '/search',
    }
};

export const getApiUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;
