// API configuration for different environments
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production fallback - your actual Render URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://edu-desk-m28m.onrender.com';
  }
  
  // Development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Log for debugging
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

export default API_BASE_URL;