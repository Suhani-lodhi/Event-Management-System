import axiosInstance from "./axiosInstance";

const post = async (url, body, fallback) => {
  try {
    const res = await axiosInstance.post(url, body);
    return { data: res.data, status: res.status };
  } catch (err) {
    const data = err.response?.data;
    const error = new Error(data?.message || data?.msg || fallback);
    error.response = { data, status: err.response?.status };
    throw error;
  }
};

export const loginUser = (credentials) =>
  post("/auth/login", credentials, "Login failed");

export const signupParticipant = (formData) =>
  post("/auth/participantSignup", formData, "Signup failed");

export const signupOrganizer = (formData) =>
  post("/auth/organizerSignup", formData, "Signup failed");