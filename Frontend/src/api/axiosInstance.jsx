// api/axiosInstance.js
import axios from "axios";


const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let queue = []

const flushQueue = (error) => {
  const pending = queue;
  queue = [];
  pending.forEach(({resolve,reject,config})=>{
    if (error) reject(error);
    else resolve(axiosInstance(config));
  })
}

axiosInstance.interceptors.response.use(
  (res)=> res,
  (error) => {
    const config = error.config
    const status = error.response?.status
    const code = error.response?.data?.code
  
    const needRefresh = status === 401 && (code === "TOKEN_EXPIRED" || code === "TOKEN_MISSING") && !config._retry && !config.url.includes("/auth/refresh");

    if (!needRefresh) return Promise.reject(error)

    config._retry = true;

    const parked = new Promise((resolve,reject)=>{
      queue.push({resolve,reject,config})
    })

    if (!isRefreshing){
      isRefreshing = true
      axiosInstance.post("/auth/refresh")
      .then(()=>flushQueue(null))
      .catch((refreshError)=>{
        flushQueue(refreshError)
        window.dispatchEvent(new Event("auth:logout"))
      })
      .finally(()=>{isRefreshing=false})
    }
    return parked;
  }
)

export default axiosInstance;


