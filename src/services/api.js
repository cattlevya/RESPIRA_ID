const API_URL = 'http://localhost:5000/api';

export const api = {
    // --- AUTH ---
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (result.success) localStorage.setItem('user', JSON.stringify(result.user));
            return result;
        } catch (error) {
            return { success: false, message: 'Connection Error' };
        }
    },

    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (result.success) localStorage.setItem('user', JSON.stringify(result.user));
            return result;
        } catch (error) {
            return { success: false, message: 'Connection Error' };
        }
    },

    logout: () => {
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // --- HISTORY & DIAGNOSIS ---
    getHistory: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/history/${userId}`);
            return await response.json();
        } catch (error) {
            return { success: false, data: [] };
        }
    },

    saveDiagnosis: async (data) => {
        try {
            const response = await fetch(`${API_URL}/diagnosis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    },

    // --- SCORE & CHECKIN ---
    getScore: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/score/${userId}`);
            return await response.json();
        } catch (error) {
            return { success: false, score: null };
        }
    },

    saveScore: async (userId, score) => {
        try {
            const response = await fetch(`${API_URL}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, score })
            });
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    },

    checkTodayStatus: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/checkin/today/${userId}`);
            return await response.json();
        } catch (error) {
            return { success: false, hasCheckedIn: false };
        }
    },

    // --- AQI ---
    getAQI: async (lat, lon) => {
        try {
            const response = await fetch(`${API_URL}/aqi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lon })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Connection Error' };
        }
    },

    // --- NEWS ---
    getNews: async () => {
        try {
            const response = await fetch(`${API_URL}/news`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            return { success: false, data: [] };
        }
    },

    // --- PROFILE ---
    getProfile: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/user/profile/${userId}`);
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    },

    updateProfile: async (userId, data) => {
        try {
            const response = await fetch(`${API_URL}/user/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    }
};
