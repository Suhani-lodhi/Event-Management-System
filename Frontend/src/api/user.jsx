import axiosInstance from "./axiosInstance";


const getEvents = async () =>{
     try {
        const res = await axiosInstance.get("user/getAllEvents");
        
        return res.data;
    } catch (err) {
        throw new Error("could not fetch events");
    }
}
const getEventDetailsForUser = async (id) => {
    try {
        const res = await axiosInstance.get(`user/getEvent/${id}`);
        return res.data;
    } catch (err) {
        throw new Error("could not fetch events");
    }
};


const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );

export const getEventsByFilter = async ({ category, genre, search, page, limit } = {}, signal) => {
  const  {data}  = await axiosInstance.get('user/events', {
    params: cleanParams({ category, genre, search, page, limit }),
    signal, 
  });
  console.log("api service", data)
  return data; 
};



export {getEventDetailsForUser, getEvents}
