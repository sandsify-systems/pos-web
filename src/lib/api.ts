
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token and business ID
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token') || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    const businessId = Cookies.get('current_business_id') || (typeof window !== 'undefined' ? localStorage.getItem('current_business_id') : null);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (businessId) {
      config.headers['X-Current-Business-ID'] = businessId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear cookies and redirect to login if unauthorized
      Cookies.remove('auth_token');
      Cookies.remove('current_business_id');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
