import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { getEventDetails } from "../../api/event";
import '../Organizer/styles/OrganizerDashboard.css'

export default function EventDetails(){
    const {id}= useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        async function getevent(){
           try {
                const data = await getEventDetails(id);
                console.log(data.event);
                setEvent(data.event);
            }
            catch (err) {
                console.log("error occurred in get all events")
            } finally {
                setLoading(false);
            }
        }
        getevent();
    },[])
    return(
        <>

             {loading ? (
        <p className="od-loading">Loading events...</p>
      ) : (
           
           <div className="od-event-card od-ed-card-" >
              

            </div>
      )
    }
        </>
    )
}