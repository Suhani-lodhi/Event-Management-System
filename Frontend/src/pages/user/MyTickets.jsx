import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { cancelBooking, getTicketsByBookingId } from "../../api/user";
import { getImageSrc } from "../../utils/imageUrl";
import Dialog from '@mui/material/Dialog';
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { NumberField } from '@base-ui/react/number-field';
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";


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
    const [cancelQty, setCancelQty] = useState({});
    const [openCancel, setOpenCancel] = useState(false);
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

    const handleChange = (id, value) => {
      console.log("handle change",cancelQty)
  setCancelQty(prev => ({ ...prev, [id]: value ?? 0 }));
   };



    const handleConfirm = async () => {
      console.log(cancelQty)
      const ticketsToCancel = ticketSummary.flatMap((t) => {
        const quantity = cancelQty[t.sessionCategoryPriceId ?? 0]
        return t.ticketIds.slice(0, quantity);
      })

      console.log(ticketsToCancel)
      
      try{
        const data = await cancelBooking(booking.id, ticketsToCancel);
        console.log(data);
        toast.success("Tickets cancelled successfully");
        window.location.reload();
      }
      catch(err){
        toast.error(err.message);
      }
      finally{
        setOpenCancel(false)
      }
      };


    const venue = subVenue?.venue;
  const address = venue
    ? [venue.addressLine1, venue.city, venue.state, venue.country, venue.pincode]
        .filter(Boolean)
        .join(", ")
    : "";

    let remainingAmount = ticketSummary.reduce((sum, t)=> {
      return sum+t.subtotal
    },0); 
    const refundedAmount = booking.totalAmount - remainingAmount;
    return (
        <>
           <div className="my-tickets">

            
      <div className="tickets-info-card" >
        {event?.imageUrl && (
          <img
            className="tickets-info-img"
            src={getImageSrc(event.imageUrl)}
            alt={event.Title}
          />
        )}

        <div className="tickets-info-body">
          <div className="tickets-info-head">
            <h2 onClick={() => navigate('/home/getEvent/'+event.id)}>{event?.Title}</h2>
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
            {booking.status==='CONFIRMED' ? <div>
              <span className="info-label">Booked Tickets</span>
              <p>{booking.totalCount}</p>
            </div>: 
            <div>
             <div>
              <span className="info-label">Booked Tickets</span>
              <p>{booking.totalCount}</p>
            </div>
             <div>
              <span className="info-label">Cancelled Tickets</span>
              <p>{booking.totalCount - tickets.length}</p>
            </div>
           </div>
            }

            {booking.status === 'CONFIRMED' ? <div>
              <span className="info-label">Total paid</span>
              <p><strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong></p>
            </div> :
            <div>
              <div>
              <span className="info-label">Total paid</span>
              <p><strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong></p>
            </div>
             <div>
              <span className="info-label">Total Refund</span>
              <p><strong>₹{refundedAmount.toLocaleString("en-IN")}</strong></p>
            </div>
            </div>
            }
            
          </div>
        </div>
      </div>

      

         {tickets.length>0 && <><h2 className="tickets-heading">Tickets</h2>
   
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
      <p><u>Do You want to cancel tickets? <strong style={{cursor: "pointer"}} onClick={() => setOpenCancel(true)} >click here</strong></u></p></>}
    </div>

    <Dialog open={openCancel} onClose={() => setOpenCancel(false)}>
       <DialogTitle>Select Tickets to cancel</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {
            ticketSummary?.map((t)=>
              <Stack key={t.sessionCategoryPriceId} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }} spacing={3}>
                <Typography>{t.alias} (you have {t.quantity})</Typography>
                <NumberField.Root
                value={cancelQty[t.sessionCategoryPriceId] ?? 0}
                onValueChange={v => handleChange(t.sessionCategoryPriceId, v)}
                min={0}
                max={t.quantity}
                >

                <NumberField.Group style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <NumberField.Decrement>−</NumberField.Decrement>
                <NumberField.Input style={{ width: 48, textAlign: 'center' }} />
                <NumberField.Increment>+</NumberField.Increment>
                </NumberField.Group>

                </NumberField.Root>
              </Stack>
            )
          }
        </Stack>
      </DialogContent>


      <DialogActions>
        <Button onClick={() => setOpenCancel(false)}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleConfirm}>Cancel Selected Tickets</Button>
      </DialogActions>
    </Dialog>

    </>
    )
}