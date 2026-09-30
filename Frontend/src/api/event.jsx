const EVENT_URL = import.meta.env.VITE_API_URL + "/organizer" ;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}


const createEvent = async (data) =>{
    let res = await fetch(EVENT_URL+"/createEvent",{
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    }
    )

    if (!res.ok) {
    const error = new Error(data?.msg || 'Login failed');
    error.response = { data, status: res.status };
    throw error;
  }
    res = await res.json();
    return { res, status: res.status };
}