/**
 * API Configuration
 * Centralized backend URL configuration for all API calls
 */

export const API_CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
} as const;

// Helper function to get full API endpoint
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BACKEND_URL}${normalizedEndpoint}`;
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    backendUrl: API_CONFIG.BACKEND_URL,
    environment: import.meta.env.MODE,
  });
}
