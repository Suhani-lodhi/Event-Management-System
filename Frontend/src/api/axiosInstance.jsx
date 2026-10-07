// api/axiosInstance.js
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearSession,
} from "./tokenStorage";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  // console.log("Frontend token.....", token)
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const refreshTokens = () => {
  if (!refreshPromise) {
    // plain axios (not axiosInstance) so this call skips these interceptors
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken: getRefreshToken() })
      .then((res) => saveTokens(res.data)) // backend rotates BOTH tokens
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
 
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      original._retry = true;
 
      try {
        await refreshTokens();
      } catch {
        clearSession();
        window.dispatchEvent(new Event("auth:logout")); 
        return Promise.reject(error);
      }
 
      return axiosInstance(original); 
    }
 
    return Promise.reject(error);
  }
);
 
export default axiosInstance;