import axiosInstance from "./axiosInstance";

const createEvent = async (eventData) => {
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
        const res = await axiosInstance.get("organizer/getEvents");
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
        const res = await axiosInstance.get(`organizer/deleteEvent/${id}`);
        return res.data;
    } catch (err) {
        throw new Error("could not fetch events");
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
        const res = await axiosInstance.get(`organizer/subVenues/${id}`)
        return res.data;
    }
    catch(err){
         throw new Error("could not fetch sub venues");
    }
}

export { createEvent, getAllEvents, getEventDetails, createSession, getVenues, getSubVenues, deleteEventById };