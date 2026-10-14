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
export {getEventDetailsForUser}


export {
    getEvents
}