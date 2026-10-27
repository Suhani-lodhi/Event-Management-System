import { useEffect, useState } from "react"
import {  useNavigate, useParams } from "react-router-dom";
import { getEventDetails } from "../../api/event";
import '../Organizer/styles/OrganizerDashboard.css'
import Table from "../../Components/Organizer/models/Table"
import { getImageSrc } from "../../utils/imageUrl";
import { EventStatusToggle } from "../../Components/Organizer/StatusToggles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

export default function EventDetails(){
    const {id}= useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    // bumping this remounts the sessions table with fresh data
    const [tableVersion, setTableVersion] = useState(0);
    const navigate = useNavigate();

    async function loadEvent(){
        try {
            const data = await getEventDetails(id);
            // console.log(data.event);
            setEvent(data.event);
            console.log("event details -------> ", data.event)
        }
        catch (err) {
            console.log("error occurred in get all events")
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        loadEvent();
    },[id])


    function editEvent(id){
        // console.log(id)
        navigate(`../editEvent/${id}`);

    }

    // called after the server accepted a new event status.
    // Draft and Closed also close registration on every session on the server,
    // so reload the sessions and rebuild the table to show that.
    async function handleStatusChange(status){
        setEvent((prev) => ({ ...prev, status }));
        if (status === "DRAFTED" || status === "CLOSED") {
            await loadEvent();
            setTableVersion((v) => v + 1);
        }
    }

    function showStatistics(eventId, sessionId){
    navigate('/dashboard/bookingStats', {
      state: {eventId, sessionId}
    })
  }

  function showSessionStatistic(sessionId){
    showStatistics(event.id, sessionId);
  }
    


    return(
        <>

             {loading ? (
        <p className="od-loading">Loading events...</p>
      ) : !event ? (
        <p>Event not found.</p>
      ) : (
           
          <div className="ed-container">
            {/* <div className="ed-header">
                <h1>Event Details</h1>
                <p>View your event details here</p>
            </div> */}

          

          <button className="backBtn" onClick={() => navigate(-1)}> 
        &#8249; Back 
      </button>




                <div className="ed-card">
                  <div className="ed-banner">

                {event.imageUrl ? (
                    <img
                      src={getImageSrc(event.imageUrl)}
                      alt={event.Title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"; 
                      }}

                      className="ed-banner-img"
                    />
                  ) : (
                    <div className="ed-banner-placeholder">No image</div>
                  )}
                </div>

                    <div className="ed-event-top">
                  <h1>{event.Title}</h1>
                  <div >
                    <FontAwesomeIcon icon={faChartLine} onClick={() => showStatistics(event.id)} style={{cursor: "pointer"}}/>
                    <span className={`od-status od-status-${event.status?.toLowerCase()}`}>
                    {event.status}
                  </span>
                  <button onClick={() => editEvent(event.id)}>Edit event</button>
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

                <EventStatusToggle
                  eventId={event.id}
                  status={event.status ?? "DRAFTED"}
                  onChange={handleStatusChange}
                />
                   
                </div>

            <br/>

            <div className="ed-sessions">
                <h1 className="ed-session-heading">Sessions</h1>  
            <button onClick={() => navigate("/dashboard/addSessions/"+id)} >Add Session</button>
            </div>
            
            <br/>

            <Table key={tableVersion} sessions={event.sessions} showSessionStatistic={showSessionStatistic}/>
               
          </div>
      )
    }
        </>
    )
}