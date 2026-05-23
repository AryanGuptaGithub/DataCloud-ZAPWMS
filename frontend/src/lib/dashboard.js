// frontend/src/lib/dashboard.js
import api from "./axios";

export async function getDashboardData(range = 'month') {
  try {
    const { data } = await api.get(`/dashboard?range=${range}`);
    console.log("📊 Dashboard data received:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    throw error;
  }
}

// Or if you want separate endpoints, update your backend to have them
export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard");
  console.log("📊 Summary data received:", data);
  return data;
}