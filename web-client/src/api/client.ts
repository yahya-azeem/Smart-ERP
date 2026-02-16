import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Direct to Rust API
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': '11111111-1111-1111-1111-111111111111', // Default Tenant from seed data
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
