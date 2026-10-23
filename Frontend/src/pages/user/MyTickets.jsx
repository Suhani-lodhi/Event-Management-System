import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { getTicketsByBookingId } from "../../api/user";
import { getImageSrc } from "../../utils/imageUrl";

const fmt = { dateStyle: "medium", timeStyle: "short" };

export default function MyTickets(){

    const {id} = useParams();
    const [tickets, setTickets] = useState([])
    const [booking, setBooking] =useState(null);
    const [event, setEvent] = useState(null);
    const [session, setSession] = useState(null);
    const [subVenue, setSubVenue] = useState(null);
    const [ticketSummary, setTicketSummary] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();

    useEffect(()=>{
       async function getTickets(){
        try{
           const res = await getTicketsByBookingId(id);
           console.log(res);
           setTickets(res.tickets);
           setBooking(res.booking);
           setEvent(res.event);
           setSession(res.session);
           setSubVenue(res.subVenue);
           setTicketSummary(res.ticketSummary)
        }
        catch(err){
           console.log(err);
        }
        finally{
            setLoading(false)
        }
       }

       getTickets();
    },[id]);

    if (loading) return <p>Loading Tickets...</p>


    const venue = subVenue?.venue;
  const address = venue
    ? [venue.addressLine1, venue.city, venue.state, venue.country, venue.pincode]
        .filter(Boolean)
        .join(", ")
    : "";
    return (
        <>
           <div className="my-tickets">

            
      <div className="tickets-info-card" onClick={() => navigate('/home/getEvent/'+event.id)}>
        {event?.imageUrl && (
          <img
            className="tickets-info-img"
            src={getImageSrc(event.imageUrl)}
            alt={event.Title}
          />
        )}

        <div className="tickets-info-body">
          <div className="tickets-info-head">
            <h2>{event?.Title}</h2>
            <span className={`status-badge status-${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
          </div>

          <div className="info-block">
            <span className="info-label">Session</span>
            <p>
              {new Date(session.startDateTime).toLocaleString("en-IN", fmt)}
              {" – "}
              {new Date(session.endDateTime).toLocaleString("en-IN", fmt)}
            </p>
          </div>

          {subVenue && (
            <div className="info-block">
              <span className="info-label">Venue</span>
              <p>
                <strong>{subVenue.subVenueName}</strong>
                <strong>{venue?.venueName && `, ${venue.venueName}`}</strong>
              </p>
              {address && <p className="info-muted">{address}</p>}
            </div>
          )}

          <div className="info-footer">
            <div>
              <span className="info-label">Booking</span>
              <p>
                #{booking.id} · {new Date(booking.bookedOn).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
            <div>
              <span className="info-label">Tickets</span>
              <p>{booking.totalCount}</p>
            </div>
            <div>
              <span className="info-label">Total paid</span>
              <p><strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong></p>
            </div>
          </div>
        </div>
      </div>

      

        <h2 className="tickets-heading">Tickets</h2>
   
      <div className="ticket-rows">
        {ticketSummary?.map((t, index) => (
          <div key={index} className={`ticket-row-card`}>
            <span className="ticket-number">{index + 1}</span>

            <div className="ticket-row-main">
              <h3>{t.alias}</h3>
              <p className="info-muted">{t.unitPrice} × {t.quantity}</p>
            </div>

            <div className="ticket-row-side">
              <strong>₹{t.subtotal.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
        </>
    )
}