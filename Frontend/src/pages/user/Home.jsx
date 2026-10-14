import { useEffect, useState } from "react"
import { getEvents } from "../../api/user";

export default function Home(){
  
    const [events, setEvents] = useState([]);

    useEffect(()=>{
        async function getAllEvents () {
            const data = await getEvents();
            console.log(data);
        }
    })


    return (
        <>
          <h1>Events</h1>
        </>
    )
}