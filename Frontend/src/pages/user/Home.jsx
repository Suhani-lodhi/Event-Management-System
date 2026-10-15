import { useEffect, useState } from "react"
import { getEvents } from "../../api/user";
import EventCard from "../../Components/User/EventCard";

export default function Home(){
  
    const [events, setEvents] = useState([]);

    useEffect(()=>{
        async function getAllEvents () {
            const data = await getEvents();
            console.log(data);
            setEvents(data.events)
        }
        getAllEvents()
    },[])


    return (
        <>
          {
            events.length > 0 ? 
            <div className="ud-events">
                {
                    events.map((e)=>{
                        return <EventCard key={e.id} event={e}/>
                    })
                }
            </div>
            : <p>No events to show....</p>
          }
        </>
    )
}