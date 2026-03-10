import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    return response;
  },
  (error) => {
    // If the token is invalid or expired
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login";
    }

    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const customError = {
      message: "Bilinməyən xəta baş verdi",
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response) {
      // Server response given (e.g., 400, 422, 500)
      customError.message = error.response.data?.message || customError.message;
    } else if (error.request) {
      // The request was made but no response was received
      customError.message =
        "Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.";
    }

    return Promise.reject(customError);
  },
);

export default api;
