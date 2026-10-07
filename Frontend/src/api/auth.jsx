import axiosInstance from "./axiosInstance";

import { saveTokens,saveUser } from "./tokenStorage";

export async function loginUser(credentials) {
  try {
    const res = await axiosInstance.post("/auth/login", credentials);
    const { accessToken, refreshToken, user } = res.data;
    
    if (accessToken) {
      // 1. Pass the correct structured object
      saveTokens({ accessToken, refreshToken }); 
      saveUser(user);
    }
    return { data: res.data, status: res.status };
  } catch (err) {
    console.log(err)
    const data = err.response?.data;
    const error = new Error(data?.msg || "Login failed");
    error.response = { data, status: err.response?.status };
    throw error;
  }
}

export async function signupParticipant(formData) {
  try {
    const res = await axiosInstance.post("/auth/participantSignup", formData);
    if (res.data?.accessToken) {
      saveTokens(res.data); 
    }
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