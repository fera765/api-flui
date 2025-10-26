import axios from 'axios';

// API Base URL - pode ser configurado via variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Você pode adicionar tokens de autenticação aqui no futuro
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to connect to SSE endpoints
export const connectSSE = (
  url: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): EventSource => {
  const fullUrl = `${API_BASE_URL}${url}`;
  const eventSource = new EventSource(fullUrl);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    if (onError) {
      onError(error);
    }
  };

  return eventSource;
};

export default apiClient;
