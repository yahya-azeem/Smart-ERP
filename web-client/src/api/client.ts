import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api', // CVE-13: Use relative URL via nginx proxy (no hardcoded port)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically set tenant-id from JWT claims when token is available
export function setTenantFromToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.tenant_id) {
      apiClient.defaults.headers.common['x-tenant-id'] = payload.tenant_id;
    }
  } catch {
    // Invalid token format — tenant-id will not be set
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
