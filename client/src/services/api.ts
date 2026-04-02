import axios from 'axios';

// 1. Determine the base URL dynamically based on the environment variables.
// Vite uses import.meta.env instead of process.env!
// If VITE_API_BASE_URL is not set, we default to localhost:8080 or an empty string.
const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

// 2. Create an Axios Instance
// This is your centralized API communication point. 
// Every request will use these base settings.
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Automatically send credentials (cookies, authorization headers) if supported
  withCredentials: true,
});

// 3. Add an Interceptor for Outgoing Requests
// We can intercept the request before it leaves your frontend to attach tokens!
apiClient.interceptors.request.use(
  (config) => {
    // Attempt to read the user's token from localStorage
    try {
      const raw = localStorage.getItem("courseflow_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token) {
           // Attach the token safely to the Authorization header
           config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
       console.warn("Could not read auth token from localStorage.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Add an Interceptor for Incoming Responses
// Handle global errors here like 401 Unauthorized or 403 Forbidden
apiClient.interceptors.response.use(
  (response) => {
    // If the response is successful, return it directly
    return response;
  },
  (error) => {
    // Example: If user's token is invalid or expired
    if (error.response?.status === 401) {
      console.error("Unauthorized: Please log in again.");
      // You could programmatically dispatch a logout action or window.location.href = '/login' here
    }
    if (error.response?.status === 403) {
      console.error("Forbidden: You do not have permission to perform this action.");
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// 5. Build your Service Layer!
// Below are examples of how you define organized, reusable API calls.
// -------------------------------------------------------------

export const authService = {
  login: async (credentials: any) => {
    // We only need to provide the route path!
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  }
};

export const courseService = {
  // Example of a GET request
  getAllCourses: async () => {
    const response = await apiClient.get('/api/courses');
    return response.data;
  },
  // Example of a GET request with dynamic ID
  getCourseById: async (id: string) => {
    const response = await apiClient.get(`/api/courses/${id}`);
    return response.data;
  }
};

export const adminService = {
  getTeachers: async (page = 0, size = 10) => {
    const response = await apiClient.get(`/api/admin/teachers?page=${page}&size=${size}`);
    return response.data;
  },
  getPendingTeachers: async (page = 0, size = 10) => {
    const response = await apiClient.get(`/api/admin/pending-teachers?page=${page}&size=${size}`);
    return response.data;
  }
};

export default apiClient;
