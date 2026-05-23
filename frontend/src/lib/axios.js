// frontend/src/lib/axios.js
import axios from "axios";
const backendurl = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: backendurl,
});

// console.log(backendurl + "is Connected");

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
