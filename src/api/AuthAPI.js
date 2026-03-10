import api from "../config/axios.config";

export const AuthAPI = {
  login: async (credentials) => {
    const response = await api.post("/login", credentials);
    if (response.data.token) {
      localStorage.setItem("admin_token", response.data.token);
      localStorage.setItem("admin_user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/logout");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    return response.data;
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem("admin_user");
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem("admin_token");
  },
};
