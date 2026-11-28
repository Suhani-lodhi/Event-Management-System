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


const cancelBooking = async (bookingId, ticketIds) => {
  console.log("booking tickets cancel", ticketIds);
  try {
    const res = await axiosInstance.patch(`/user/cancelBooking/${bookingId}`, ticketIds ? { ticketIds } : {});
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "cannot cancel booking");
  }
};

const getTicketsByBookingId = async (bookingId) =>{
  try {
    const res = await axiosInstance.get(`/user/bookings/tickets/${bookingId}`);
    return res.data;
  } catch (err) {
    console.log(err);
    throw new Error(err.response?.data?.message || "cannot get tickets");
  }
}

const getSeatMap = async (sessionId) =>{
  try{
    const res = await axiosInstance.get(`/user/session/${sessionId}/seatMap`);
    return res.data;
  }
  catch(err){
    console.log(err);
    throw new Error(err.response?.data?.message || "cannot get seat Map");
  }
}

const getMovieBookingSummary = async (payload) =>{
  try{
    const res = await axiosInstance.post(`/user/session/getMovieTicketSummary`, payload);
    return res.data;
  }
  catch(err){
    console.log(err);
    throw new Error(err.response?.data?.message || "cannot get movie booking summary");
  }
}

const payForMovieTickets = async (payload) =>{
  try{
    const res = await axiosInstance.post(`/user/session/payForMovieSeats`, payload);
    return res.data;
  }
  catch(err){
    console.log(err);
    throw new Error(err.response?.data?.message || "Cannot complete the booking. Something went wrong.");
  }
}

const confirmMovieBooking = async (payload) =>{
  try{
    const res = await axiosInstance.post(`/user/session/confirmMovieBooking`, payload);
    return res.data;
  }
  catch(err){
    console.log(err);
    throw new Error(err.response?.data?.message || "Cannot complete the booking. Something went wrong.");
  }
}

const cancelMovieBooking = async (bookingId) =>{
  try{
    const res = await axiosInstance.patch(`/user/cancelBooking/${bookingId}`);
    return res.data;
  }
  catch(err){
    console.log(err);
    throw new Error(err.response?.data?.message || "Cannot cancel the booking");
  }
}

export {getEventDetailsForUser, getEvents, getEventsByFilter, getPricingDetailsOfSession, 
   getBookingSummary, payForBooking, getAllBookings, cancelBooking, getTicketsByBookingId,
   getSeatMap, getMovieBookingSummary, payForMovieTickets, confirmMovieBooking, cancelMovieBooking}
