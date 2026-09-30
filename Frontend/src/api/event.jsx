const EVENT_URL = import.meta.env.VITE_API_URL + "/organizer" ;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}


const createEvent = async (eventData) =>{
    const res = await fetch(EVENT_URL+"/createEvent",{
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData)
    }
    )
    const data = await res.json();
    if (!res.ok) {
    const error = new Error(data?.msg || 'event creation failed');
    error.response = { data, status: false};
    throw error;
  }

    return { res, status: true };
}

const getAllEvents = async () =>{
    const res = await fetch(EVENT_URL+"/getEvents", {
        method: "GET",
        headers: getAuthHeaders()
    })

    if(!res.ok){
         throw new Error("could not fetch events");
    }

    const data = await res.json();
    return data;
}

const getEventDetails = async (id) =>{
   const res = await fetch(EVENT_URL+"/getEvent/"+id, {
        method: "GET",
        headers: getAuthHeaders()
    })

    if(!res.ok){
         throw new Error("could not fetch events");
    }

    const data = await res.json();
    return data;
}


const createSession = async (sessionData, id) =>{
    const res = await fetch(EVENT_URL+"/createSession/"+id,{
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    }
    )
    const data = await res.json();
    if (!res.ok) {
    const error = new Error(data?.msg || 'event creation failed');
    error.response = { data, status: false};
    throw error;
  }

    return { res, status: true };
}



export {
    createEvent,
    getAllEvents,
    getEventDetails
}