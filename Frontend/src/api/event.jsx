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
    console.log("get event -----> ", id)
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

const getSubVenues = async (id) =>{
    try{
        console.log("Id............",id)
        const res = await axiosInstance.get(`organizer/subVenues/${id}`)
        console.log(res)
        console.log(res.data)
        return res.data;
    }
    catch(err){
         throw new Error("could not fetch sub venues");
    }
}

const createVenue = async (data)=>{
    try{
       const res = await axiosInstance.post(`organizer/createVenue`, data);
       console.log(res.data);
       return res.data
    }
    catch{
       throw new Error("could not create venue")
    }
}

export { CreateEvent, getAllEvents, getEventDetails, createSession, getVenues, getSubVenues, 
    deleteEventById, updateEvent, deleteSessionById, updateSessionById,
    createVenue 

};