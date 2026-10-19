import axiosInstance from "./axiosInstance";

export const getProfile = async (id) => {
  const { data } = await axiosInstance.get(`/profile/profile/${id}`);
  return data;
};
 
export const updateProfile = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/profile/editProfile/${id}`, payload);
  return data;
};
