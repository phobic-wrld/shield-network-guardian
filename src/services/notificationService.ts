import axios from "axios";

const API_URL = "http://localhost:5000/api/notifications";

export const fetchNotifications = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const markNotificationsRead = async () => {
  const token = localStorage.getItem("token");
  await axios.post(`${API_URL}/mark-read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
