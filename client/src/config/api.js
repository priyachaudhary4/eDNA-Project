// Central API configuration
// In development: uses localhost:8000
// In production: uses VITE_API_BASE_URL environment variable (set on Vercel)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Export as default to support legacy imports
export default API_BASE_URL;
