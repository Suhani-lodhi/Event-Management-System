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


    function editEvent(){
        
    }




    return(
        <>

             {loading ? (
        <p className="od-loading">Loading events...</p>
      ) : (
           
          <div className="ed-container">
            <div className="ed-header">
                <h1>Event Details</h1>
                <p>View your event details here</p>
            </div>

                <div className="ed-card" >
                    <div className="ed-event-top">
                  <h1>{event.Title}</h1>
                  <div >
                    <span className={`od-status od-status-${event.status?.toLowerCase()}`}>
                    {event.status}
                  </span>
                  <button onClick={editEvent}>Edit event</button>
                  </div>
                </div>
                    <p className="od-event-description">{event.Description}</p>
                <br />
                <div className="od-event-tags">
                  {event.category && (
                    <span className="od-tag">{event.category}</span>
                  )}
                  {event.genre && (
                    <span className="od-tag">{event.genre}</span>
                  )}
                </div>
                   
                </div>
          </div>
      )
    }
        </>
    )
}