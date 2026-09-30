import '../Organizer/styles/OrganizerDashboard.css'
import { useEffect, useState } from "react";
import { getAllEvents } from "../../api/event";
import { useNavigate } from 'react-router-dom';

export default function OrganizerDashboard() {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all")
    const [filteredEvents, setFilteredEvents] = useState([]);
    const navigate = useNavigate();



    useEffect(() => {
        async function fetchEvents() {
            try {
                const data = await getAllEvents();
                console.log(data.events)
                setEvents(data.events);
                setFilteredEvents(data.events)
            }
            catch (err) {
                console.log("error occurred in get all events")
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [])

    function getfilteredEvents(e){
       console.log("onchange called", e.target.value)

       if(e.target.value=="all"){
        setFilteredEvents(events)
        return;
       }
       setFilteredEvents(events.filter((event)=> event.status==e.target.value))
    }


    if (loading) return <p>Loading events...</p>;

    return (
        <>
            <div className="od-page">
      <div className="od-banner">
        <div className="od-banner-text">
          <h2>Ready to host your event?</h2>
        </div>
        <button type="button" className="od-banner-btn" onClick={() => navigate("/dashboard/createEvent")} >
          Create Event
        </button>
      </div>


      <div className="od-overview-header">
        <div>
          <h1>Your Events</h1>
        </div>
      </div>


<div>
     <select onChange={getfilteredEvents} defaultValue="all">
            <option value="all">All</option>
            <option value="DRAFTED">Draft</option>
            <option value="COMING_SOON">Up-coming</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
        </select>
</div>
      
    
      {loading ? (
        <p className="od-loading">Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <div className='od-empty'>
            <p>No events yet. Want to create one?</p>
            <button onClick={() => navigate("/dashboard/createEvent")} >Create Event</button>
        </div>
      ) : (
        <div className="od-event-list">
          {filteredEvents.map((event) => (
            <div className="od-event-card" key={event.id}>
              <div className="od-event-main">
                <div className="od-event-top">
                  <h3>{event.Title}</h3>
                  <span className={`od-status od-status-${event.status?.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>

                <p className="od-event-description">{event.Description}</p>

                <div className="od-event-tags">
                  {event.category && (
                    <span className="od-tag">{event.category}</span>
                  )}
                  {event.genre && (
                    <span className="od-tag">{event.genre}</span>
                  )}
                </div>

              </div>

              <span className="od-event-arrow">&#8250;</span>
            </div>
          ))}
        </div>
      )}
    </div>
        </>
    )
}