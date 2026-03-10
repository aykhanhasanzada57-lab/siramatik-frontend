import api from "../config/axios.config";

export const ProviderAPI = {
  /**
   * Get provider basic info and work settings
   * @param {string} slug
   */
  getDetails: async (slug) => {
    const response = await api.get(`/providers/${slug}`);
    return response.data;
  },

  /**
   * Get available slots for a specific date
   * @param {string} slug
   * @param {string} date (YYYY-MM-DD format)
   */
  getSlots: async (slug, date) => {
    const response = await api.get(`/providers/${slug}/slots`, {
      params: { date },
    });
    return response.data;
  },

  /** ADMIN SECTION **/

  /**
   * Get authenticated provider details
   */
  getMyDetails: async () => {
    const response = await api.get("/provider/me");
    return response.data;
  },

  /**
   * Get authenticated provider schedule
   */
  getMySchedule: async () => {
    const response = await api.get("/provider/me/schedules");
    return response.data;
  },

  /**
   * Bulk update schedule
   * @param {Object} data { days: [{day_of_week, start_time, end_time, slot_interval, is_active}, ...] }
   */
  updateMySchedule: async (data) => {
    const response = await api.post("/provider/me/schedules", data);
    return response.data;
  },

  /**
   * Get override schedule for a specific date
   */
  getDailySchedule: async (date) => {
    const response = await api.get("/provider/me/daily-schedule", {
      params: { date },
    });
    return response.data;
  },

  /**
   * Set override for a specific date
   */
  updateDailySchedule: async (data) => {
    const response = await api.post("/provider/me/daily-schedule", data);
    return response.data;
  },

  /**
   * Update global settings
   * @param {Object} data { max_advance_days, early_arrival_minutes }
   */
  updateMySettings: async (data) => {
    const response = await api.post("/provider/me/settings", data);
    return response.data;
  },
};
