import axiosInstance from "./axiosInstance";

export async function loginUser(credentials) {
  try {
    const res = await axiosInstance.post("/auth/login", credentials);
    return { data: res.data, status: res.status };
  } catch (err) {
    const data = err.response?.data;
    const error = new Error(data?.msg || "Login failed");
    error.response = { data, status: err.response?.status };
    throw error;
  }
}

export async function signupParticipant(formData) {
  try {
    const res = await axiosInstance.post("/auth/participantSignup", formData);
    return { data: res.data, status: res.status };
  } catch (err) {
    const data = err.response?.data;
    const error = new Error(data?.msg || "Signup failed");
    error.response = { data, status: err.response?.status };
    throw error;
  }
}

export async function signupOrganizer(formData) {
  try {
    const res = await axiosInstance.post("/auth/organizerSignup", formData);
    return { data: res.data, status: res.status };
  } catch (err) {
    const data = err.response?.data;
    const error = new Error(data?.msg || "Signup failed");
    error.response = { data, status: err.response?.status };
    throw error;
  }
}