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




const getBookingSummary = async (payload) => {
  try {
    const res = await axiosInstance.post("/user/bookingSummary", payload); // same axios setup as your other calls
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "cannot get the summary");
  }
};



const payForBooking = async (payload) => {   
  try {
    const res = await axiosInstance.post("/user/payForBooking", payload);   
    return res.data;
  } catch (err) {
       throw new Error(err.response?.data?.message || "cannot book tickets");

  }
};

const getAllBookings = async () =>{
  try{
    const res = await axiosInstance.get('/user/getBookings');
    return res.data;
  }
  catch(err){
    throw new Error(err.response?.data?.message || "cannot get the bookings");
  }
}


export {getEventDetailsForUser, getEvents, getEventsByFilter, getPricingDetailsOfSession, 
   getBookingSummary, payForBooking}
