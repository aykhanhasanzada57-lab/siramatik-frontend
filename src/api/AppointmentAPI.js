import api from "../config/axios.config";

export const AppointmentAPI = {
  /**
   * Submit a new appointment booking
   * @param {Object} data
   * { provider_slug, customer_name, customer_phone, date, time, agree_to_rules }
   */
  book: async (data) => {
    const response = await api.post("/appointments", data);
    return response.data;
  },

  /**
   * Get all appointments for a provider (Admin view)
   * @param {string} slug
   */
  getAll: async (slug) => {
    const response = await api.get("/appointments", {
      params: { slug },
    });
    return response.data;
  },
};
