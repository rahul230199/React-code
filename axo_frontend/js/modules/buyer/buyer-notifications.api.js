import { ApiClient } from "../../core/apiClient.js";

const BuyerNotificationAPI = {

  async getNotifications() {
    const res = await ApiClient.get("/buyer/notifications");
    if (!res.success) throw new Error("Failed to load notifications");
    return res.data;
  },

  async markRead(id) {
    await ApiClient.post(`/buyer/notifications/${id}/read`);
  }

};

export default BuyerNotificationAPI;