import { useEffect, useState } from "react"
import { getAllEvents, getBookingStats, getSessionPricing, getSessionsByEventId } from "../../api/event";
import '../Organizer/styles/BookingStats.css'
import { useLocation, useNavigate } from "react-router-dom";

export default function BookingStats() {
      const { state } = useLocation();
  const initialEventId = state?.eventId ?? "";
  const initialSessionId = state?.sessionId ?? "";

    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [category, setCategory] = useState([]);
    const [eventId, setEventId] = useState(initialEventId);
    const [sessionId, setSessionId] = useState("");
    const [seatCategoryId, setSeatCategoryId] = useState("");
    const [stats, setStats] = useState(null)
    const navigate = useNavigate()

    useEffect(()=>{
       async function getEvents(){
        const data = await getAllEvents();
        setEvents(data.event);
       }

       getEvents();

    if(initialSessionId&&initialEventId){
        loadSessions(initialEventId);
        loadCategories(initialSessionId);
        fetchStats({eventId: initialEventId, sessionId: initialSessionId});
    }
    else if (initialEventId) {
      loadSessions(initialEventId);   
      fetchStats({ eventId: initialEventId });
    }
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


    async function loadCategories(id){
        if(!id){
            setCategory([]);
            return;
        }
        try{
            const data = await getSessionPricing(id);
        console.log(data);
        setCategory(data.categories);
        setSessionId(id)
        }
        catch(err){
          console.log(err);
        }
    }





    async function fetchStats(filters) {
        const data = await getBookingStats(filters)
        console.log(data);
        setStats(data);
    }
 

    async function handleEventChange(e){
         const value = e.target.value;

        setEventId(value);
        setSessionId("");
        setSeatCategoryId("");
        setSessions([]);
        setCategory([]);
        loadSessions(value)
  
    }

    async function handleSessionChange(e){
        const value = e.target.value;

        setSessionId(value);
        setSeatCategoryId("");
        setCategory([]);

        if (!value) return;   
        await loadCategories(value);
       
    }
    
    function handleCategoryChange(e){
        const value = e.target.value;
        setSeatCategoryId(value)
    }

    async function getBookingData(){
        const filters ={ eventId, sessionId, seatCategoryId };
        console.log(filters)
        fetchStats(filters);
    }

    return (
        <>
        <div className="bs-page">
          {/* <h1>Booking stats</h1> */}
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
    <label htmlFor="bs-category">Category</label>
    <select
      id="bs-category"
      value={seatCategoryId}
      onChange={handleCategoryChange}
      disabled={!sessionId}
    >
      <option value="">All categories</option>
      {category.map((c) => (
        <option key={c.id} value={c.seatCategoryId}>
          {c.alias}
        </option>
      ))}
    </select>
  </div>
  <button onClick={getBookingData} className="bs-btn">Get Booking Statistics</button>
</div>

{stats && (
  <>
    <div className="bs-cards">
      <div className="bs-card">
        <span>Total bookings</span>
        <strong>{stats.bookings.total}</strong>
      </div>
      <div className="bs-card">
        <span>Tickets booked</span>
        <strong>{stats.tickets.booked}</strong>
      </div>
      <div className="bs-card">
        <span>Cancelled tickets</span>
        <strong>{stats.tickets.cancelled}</strong>
      </div>
      <div className="bs-card">
        <span>Net revenue</span>
        <strong>₹{stats.revenue.net.toLocaleString("en-IN")}</strong>
      </div>
      <div className="bs-card">
        <span>Remaining tickets</span>
        <strong>
          {stats.tickets.remaining} / {stats.tickets.capacity}
        </strong>
      </div>
    </div>

    <div className="bs-table-wrap">
      <table className="bs-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Price</th>
            <th>Booked</th>
            <th>Active</th>
            <th>Cancelled</th>
            <th>Revenue</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {stats.byCategory.map((c) => (
            <tr key={c.sessionCategoryPriceId}>
              <td>{c.alias}</td>
              <td>₹{c.price.toLocaleString("en-IN")}</td>
              <td>{c.ticketsBooked}</td>
              <td>{c.ticketsActive}</td>
              <td>{c.ticketsCancelled}</td>
              <td>₹{c.revenue.toLocaleString("en-IN")}</td>
              <td>{c.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
     </>)}


</div>
    
  </>
        
    
)}
   