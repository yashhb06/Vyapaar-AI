import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
    verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
    completeSignup: (data: any) => api.post('/auth/complete-signup', data),
    refreshToken: (uid: string) => api.post('/auth/refresh-token', { uid }),
};

// Vendor API
export const vendorAPI = {
    getProfile: () => api.get('/api/vendor/profile'),
    updateProfile: (data: any) => api.put('/api/vendor/profile', data),
    getStats: (params?: any) => api.get('/api/vendor/stats', { params }),
};

// Inventory API
export const inventoryAPI = {
    getAll: () => api.get('/api/inventory'),
    create: (data: any) => api.post('/api/inventory', data),
    update: (id: string, data: any) => api.put(`/api/inventory/${id}`, data),
    delete: (id: string) => api.delete(`/api/inventory/${id}`),
    getLowStock: () => api.get('/api/inventory/low-stock'),
};

// Payments API
export const paymentsAPI = {
    getAll: () => api.get('/api/payments'),
    create: (data: any) => api.post('/api/payments', data),
    update: (id: string, data: any) => api.put(`/api/payments/${id}`, data),
    delete: (id: string) => api.delete(`/api/payments/${id}`),
    markPaid: (id: string) => api.put(`/api/payments/${id}/mark-paid`),
    getStats: () => api.get('/api/payments/stats'),
    sendReminder: (reminderId: string, message?: string) =>
        api.post('/api/payments/send-reminder', { reminderId, message }),
    bulkReminder: (reminderIds: string[], message?: string) =>
        api.post('/api/payments/bulk-reminder', { reminderIds, message }),
};

// Invoices API
export const invoicesAPI = {
    getAll: () => api.get('/api/invoices'),
    create: (data: any) => api.post('/api/invoices', data),
    update: (id: string, data: any) => api.put(`/api/invoices/${id}`, data),
    updateStatus: (id: string, status: string) => api.put(`/api/invoices/${id}/status`, { status }),
    getStats: () => api.get('/api/invoices/stats'),
    generate: (invoiceId: string, format?: string) =>
        api.post('/api/invoices/generate', { invoiceId, format }),
};

// Sales API
export const salesAPI = {
    getAll: (params?: any) => api.get('/api/sales', { params }),
    create: (data: any) => api.post('/api/sales', data),
    getStats: (params?: any) => api.get('/api/sales/stats', { params }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/api/dashboard/stats'),
    getInsights: () => api.get('/api/dashboard/insights'),
};

// Voice API
export const voiceAPI = {
    processCommand: (audioFile: File) => {
        const formData = new FormData();
        formData.append('audio', audioFile);
        return api.post('/api/voice/process-command', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    testTranscription: (audioFile: File) => {
        const formData = new FormData();
        formData.append('audio', audioFile);
        return api.post('/api/voice/test-transcription', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// WhatsApp API
export const whatsappAPI = {
    chat: (message: string) => api.post('/api/whatsapp/chat', { message }),
    getSettings: () => api.get('/api/whatsapp/settings'),
    updateSettings: (data: any) => api.put('/api/whatsapp/settings', data),
    sendMessage: (phone: string, message: string, templateId?: string) =>
        api.post('/api/whatsapp/send-message', { phone, message, templateId }),
    sendPaymentReminder: (reminderId: string, phone: string, customerName: string, amount: number, dueDate?: string) =>
        api.post('/api/whatsapp/send-payment-reminder', { reminderId, phone, customerName, amount, dueDate }),
    sendInventoryAlert: (ownerPhone: string, items: Array<{ name: string, quantity: number, unit?: string }>) =>
        api.post('/api/whatsapp/send-inventory-alert', { ownerPhone, items }),
    testBot: (message: string) => api.post('/api/whatsapp/test-bot', { message }),
};

export default api;
