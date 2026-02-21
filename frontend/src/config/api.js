// Configuration for API endpoints
// Ready for future FastAPI integration

export const API_CONFIG = {
    // Use environment variable if available, otherwise fallback to localhost
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',

    ENDPOINTS: {
        RECOMMEND: '/recommend',
        DESTINATIONS: '/destinations',
        SEARCH: '/search',
    }
};

export const getApiUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;
