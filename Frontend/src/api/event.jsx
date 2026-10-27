import axiosInstance from "./axiosInstance";

const CreateEvent = async (eventData) => {
    try {
        const res = await axiosInstance.post("organizer/createEvent", eventData);
        return { res, status: true };
    } catch (err) {
        const data = err.response?.data;
        const error = new Error(data?.msg || "event creation failed");
        error.response = { data, status: false };
        throw error;
    }
};

const getAllEvents = async () => {
    try {
        const res = await axiosInstance.get("organizer/getEventsbyOrganizerId");
        
        return res.data;
    } catch (err) {
        throw new Error("could not fetch events");
    }
};



const getEventDetails = async (id) => {
    try {
        const res = await axiosInstance.get(`organizer/getEvent/${id}`);
        return res.data;
    } catch (err) {
        throw new Error("could not fetch events");
    }
};


const deleteEventById = async (id) =>{
    try {
        const res = await axiosInstance.delete(`organizer/deleteEvent/${id}`);
        return res.data;
    } catch (err) {
        throw new Error("could not delete events");
    }
}

const updateEvent = async (id, data) =>{
    try{
        const res = await axiosInstance.patch('organizer/updateEvent/' + id, data);
        return res.data;
    }
    catch (err) {
        console.log(err)
        throw new Error("could not update events");
    }
}


const createSession = async (id, session) => {
   const sessionData = session.map((s)=>{
    return {
        subVenueId : s.subVenueId,
        startDateTime : s.startDateTime,
        endDateTime : s.endDateTime,
        regStartdateTime : s.regStartDateTime,
        regEndDateTime : s.regEndDateTime
    }
   })
    try {
        const res = await axiosInstance.post(`organizer/createSession/${id}`, sessionData);
        return { res, status: true };
    } catch (err) {
        const data = err.response?.data;
        const error = new Error(data?.msg || "event creation failed");
        error.response = { data, status: false };
        throw error;
    }
};

const getSessionsByEventId = async (eventId) =>{
  try{
    const res = await axiosInstance.get('organizer/getSessions/'+eventId);
    return res.data;
  }
  catch(err){
    throw new Error("cannot get sessions")
  }
}

const updateSessionById = async (id, data) => {
    try{
        const res = await axiosInstance.patch(`organizer/updateSession/${id}`, data);
        return res.data;
    }
    catch(err){
        throw new Error("could not edit session")
    }
}


const deleteSessionById = async (id) =>{
    try{
        const res = await axiosInstance.delete(`organizer/deleteSession/${id}`);
        return res.data;
    }
    catch(err){
        throw new Error("could not delete session")
    }
    
}


// venue

const getVenues = async ()=>{
    try{
        const res = await axiosInstance.get(`organizer/venues`);
        return res.data
    }
    catch(err){
         throw new Error("could not fetch venues");
    }
}

const getVenuesOfOrganizer = async () =>{
    try{
        const res = await axiosInstance.get(`organizer/venuesByOrganizerId`)
        return res.data;
    }
    catch(err){
        throw new Error("could not get venues by organizer id")
    }
}

const getSubVenues = async (id) =>{
    try{
        const res = await axiosInstance.get(`organizer/subVenues/${id}`)
        return res.data;
    }
    catch(err){
         throw new Error("could not fetch sub venues");
    }
}

const createVenue = async (data)=>{
    try{
       const res = await axiosInstance.post(`organizer/createVenue`, data);
       return res.data
    }
    catch{
       throw new Error("could not create venue")
    }
}

const deleteVenueById = async (id) =>{
     try{
       const res = await axiosInstance.delete(`organizer/deleteVenue/${id}`);
       return res.data
    }
    catch{
       throw new Error("could not delete venue")
    }
}

const getVenueDetails = async (id) =>{
    try{
       const res = await axiosInstance.get(`organizer/venue/${id}`)
       return res.data;
    }
    catch(err){
       throw new Error("could not fetch venue details")
    }
}

const deleteSubVenue = async (id) => {
     try{
       const res = await axiosInstance.delete(`organizer/deleteSubVenue/${id}`);
       return res.data
    }
    catch{
       throw new Error("could not delete sub venue")
    }
}

const editVenueById = async (id, data)=>{
        try{
       const res = await axiosInstance.patch(`organizer/updateVenue/${id}`, data);
       return res.data
    }
    catch{
       throw new Error("could not edit venue")
    }

}

const editSubVenueById = async (id, data) =>{
    try{
       const res = await axiosInstance.patch(`organizer/updateSubVenue/${id}`, data);
       return res.data
    }
    catch{
       throw new Error("could not edit Sub venue")
    }

}

const createSubVenue = async (id, data) =>{
    try{
       const res = await axiosInstance.post(`organizer/createSubVenue/${id}`, data);
       return res.data
    }
    catch{
       throw new Error("could not edit Sub venue")
    }
}


const seatErr = (err, fallback) =>
    new Error(err.response?.data?.msg || fallback);

const getSeatCategories = async (subVenueId) => {
    try {
        const res = await axiosInstance.get(`organizer/getCategories/${subVenueId}`);
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not fetch seat categories");
    }
};

const createSeatCategory = async (subVenueId, data) => {
    try {
        const res = await axiosInstance.post(`organizer/createCategory/${subVenueId}`, data);
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not create category");
    }
};

const updateSeatCategory = async (id, data) => {
    try {
        const res = await axiosInstance.patch(`organizer/updateCategory/${id}`, data);
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not update category");
    }
};

const deleteSeatCategory = async (id) => {
    try {
        const res = await axiosInstance.delete(`organizer/deleteCategory/${id}`);
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not delete category");
    }
};

const getSessionPricing = async (sessionId) => {
    try {
        const res = await axiosInstance.get(`organizer/getSessionCategories/${sessionId}`);
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not fetch session pricing");
    }
};

const saveSessionPricing = async (sessionId, categories) => {
    try {
        const res = await axiosInstance.put(`organizer/setSessionCategories/${sessionId}`, { categories });
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not save session pricing");
    }
};
const updateEventStatus = async (id, status) => {
    try {
        const res = await axiosInstance.patch(`organizer/updateEventStatus/${id}`, { status });
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not update event status");
    }
};

const updateRegistrationStatus = async (sessionId, registrationStatus) => {
    try {
        const res = await axiosInstance.patch(`organizer/updateRegistrationStatus/${sessionId}`, { registrationStatus });
        return res.data;
    } catch (err) {
        throw seatErr(err, "could not update registration status");
    }
};



// Booking apis call

const getBookingStats = async (filters) =>{
    console.log(filters)
  try{
    const res = await axiosInstance.get("/organizer/getBookingStats",{
    params: filters
  })
  return res.data;
  }
  catch(err){
    throw new Error("could not fetch booking stats");
  }
}




export { CreateEvent, getAllEvents, getEventDetails, createSession, getVenues, getSubVenues, 
    deleteEventById, updateEvent, getSessionsByEventId, deleteSessionById, updateSessionById,
    createVenue , getVenuesOfOrganizer, deleteVenueById, getVenueDetails, deleteSubVenue, editVenueById, 
    editSubVenueById,createSubVenue, seatErr,getSeatCategories,createSeatCategory,updateSeatCategory,
    deleteSeatCategory, getSessionPricing, saveSessionPricing, updateEventStatus, updateRegistrationStatus,
    getBookingStats
};