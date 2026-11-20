import { useEffect, useState } from "react"
import { getAllEvents, getBookingStats, getSessionPricing, getSessionsByEventId } from "../../api/event";
import '../Organizer/styles/BookingStats.css'
import { useLocation, useNavigate } from "react-router-dom";
import { getBookingsByEmail } from "../../api/event";
import { toast } from "react-toastify";
import '../user/styles/MyBookings.css';
import { getImageSrc } from "../../utils/imageUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye } from "@fortawesome/free-solid-svg-icons";

export default function CheckBooking() {

    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [eventId, setEventId] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [email, setEmail]= useState("");
    const [bookings, setBookings] = useState([]);
    const navigate = useNavigate()

    useEffect(()=>{
       async function getEvents(){
        const data = await getAllEvents();
        setEvents(data.event);
       }

       getEvents();
    },[]);

    async function loadSessions(id){
        if(!id){
            setSessions([]);
            return;
        }
        try{
             const data = await getSessionsByEventId(id);
              setSessions(data.sessions);
        }
        catch(err){
            console.log(err);
        }
    }





    async function handleEventChange(e){
         const value = e.target.value;

        setEventId(value);
        setSessionId("");
        setSessions([]);
        loadSessions(value)
  
    }

    async function handleSessionChange(e){
        const value = e.target.value;

        setSessionId(value);

       
    }
    function handleEmailChange(e){
    const value = e.target.value;
    setEmail(value)
    }
    


 

    async function showBookings(){
        const filters = {eventId, sessionId, email}
        try{
            const data = await getBookingsByEmail(filters)
            console.log(data);
            setBookings(data.bookings)
        }
        catch(err){
            console.log(err);
            setBookings([])
        }
    }


    return (
        <>
        <div className="bs-page">
           <button className="backBtn" onClick={() => navigate(-1)}> 
            &#8249; Back 
            </button>
          <div className="bs-filters">
  <div className="bs-filter">
    <label htmlFor="bs-event">Event</label>
    <select id="bs-event" value={eventId} onChange={handleEventChange}>
      <option value="">Select event</option>
      {events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.Title}
        </option>
      ))}
    </select>
  </div>

  <div className="bs-filter">
    <label htmlFor="bs-session">Session</label>
    <select
      id="bs-session"
      value={sessionId}
      onChange={handleSessionChange}
      disabled={!eventId}
    >
      <option value="">All sessions</option>
      {sessions.map((s) => (
        <option key={s.id} value={s.id}>
          {new Date(s.startDateTime).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </option>
      ))}
    </select>
  </div>

  <div className="bs-filter">
    <label htmlFor="bs-email">Email</label>
    <input id="bs-email" 
    onChange={handleEmailChange}
    placeholder="Enter email"/>
  </div>
  <button onClick={showBookings} className="bs-btn" disabled={eventId === "" || sessionId === "" || email === ""}>Show Bookings</button>
</div>



</div>

<div style={{
    display: "flex",
    justifyContent: "center",
    textWrap: "nowrap",
}}>
{bookings?.length === 0 ? (
    <p className="my-bookings-empty">Currently no bookings.</p>
  ) : (
    <div className="my-bookings-block">
      {bookings?.map((b) => {
  const venue = b.subVenue?.venue;
  const start = new Date(b.session.startDateTime);
  const end = new Date(b.session.endDateTime);
  const fmt = { dateStyle: "medium", timeStyle: "short" };

  return (
    <div key={b.id} className="booking-card">
      <div>
        {b.event.imageUrl && (
        <img
          className="booking-card-img"
          src={getImageSrc(b.event.imageUrl)}
          alt={b.event.Title}
          onClick={() => navigate('/home/getEvent/'+b.event.id)}
        />
      )}
      </div>

      <div className="booking-card-body">
        <div className="booking-card-head">
          <h3 onClick={() => navigate('/home/getEvent/'+b.event.id)} style={{cursor: "pointer"}}>{b.event.Title.trim()}</h3>
          <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
        </div>

        <p className="booking-card-date">
          {start.toLocaleString("en-IN", fmt)} – {end.toLocaleString("en-IN", fmt)}
        </p>

        {b.subVenue && (
          <div className="booking-card-venue">
            <p className="venue-name">
              {b.subVenue.subVenueName}
              {venue?.venueName && `, ${venue.venueName}`}
            </p>
            {venue && (
              <p className="venue-address">
                {[venue.addressLine1, venue.city, venue.state, venue.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="booking-card-foot">
          <span>
            {/* {b.totalCount} ticket{b.totalCount > 1 ? "s" : ""} */}
          </span>
         <p onClick={()=> navigate('/organizer/attendance/'+b.id)} style={{cursor: "pointer"}}>View Bookings<FontAwesomeIcon icon={faEye}/></p>
        </div>
      </div>
    </div>
  );
})}
    </div>
  )}

  </div>
    
  </>
        
    
)}




