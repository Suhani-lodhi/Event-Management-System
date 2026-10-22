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

const getEventsByFilter = async ({ category, genre, search, page, limit } = {}, signal) => {
  const  {data}  = await axiosInstance.get('user/events', {
    params: cleanParams({ category, genre, search, page, limit }),
    signal, 
  });
  console.log("api service", data)
  return data; 
};


const getPricingDetailsOfSession = async (sessionId) =>{
  try{
    const {data} = await axiosInstance.get('user/getCategoriesPricing/'+sessionId);
    return data ;
  }
  catch(err){
    throw new Error("cannot get the pricing details of the session");
  }
}


const createBooking = async (payload) => {
  try {
    const res = await axiosInstance.post("/user/createBookings", payload);
    return res.data;
  } catch (err) {
    console.log(err)                       
    throw new Error(err.response?.data?.message || "cannot create booking");
  }
};


const getBookingDetails = async (id) =>{
  try{
    const res = await axiosInstance.get("/user/getBookings"+id);
    return res.data;
  }
  catch(err){
    throw new Error("cannot get booking details");
  }
}

const getBookingSummary = async (id) =>{
  try{
    const res = await axiosInstance.get("/user/bookings/"+id+"/summary");
    return res.data;
  }
  catch(err){
    throw new Error("cannot get booking summary");
  }
}

const payForBooking = async (id) =>{
  try{
    const res = await axiosInstance.post("/user/bookings/"+id+"/pay");
    return res.data;
  }
  catch(err){
    throw new Error("cannot get booking summary");
  }
}

const cancelBooking = async (bookingId) => {
  try {
    const res = await axiosInstance.post(`/user/bookings/${bookingId}/cancel`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "cannot cancel booking");
  }
};

export {getEventDetailsForUser, getEvents, getEventsByFilter, getPricingDetailsOfSession, 
  createBooking, getBookingSummary, getBookingDetails, payForBooking, cancelBooking}
