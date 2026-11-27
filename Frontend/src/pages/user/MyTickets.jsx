import { useEffect, useState } from "react";
import "../user/styles/MyTickets.css";
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
import { refundLabel, refundStatusText } from "../../utils/refund";


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
    const [cancellations, setCancellations] = useState([]);
    const [refundInfo, setRefundInfo] = useState(null);
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
           setCancellations(res.cancellations || []);
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
    const quantity = cancelQty[t.sessionCategoryPriceId] ?? 0;   
    return quantity > 0 ? t.ticketIds.slice(0, quantity) : [];   
    })

  if (ticketsToCancel.length === 0) {
    toast.error("Select at least one ticket to cancel");
    return;
  }


      console.log("tickets to cancel",ticketsToCancel)
      
      try{
        const data = await cancelBooking(booking.id, ticketsToCancel);
        console.log(data);
        toast.success("Tickets cancelled successfully");
        // show the refund id; the user is sent to My Bookings when they close the dialog
        setRefundInfo({
          refundRef: data.refundRef,
          refundStatus: data.refundStatus,
          refundAmount: data.refundAmount,
        });
      }
      catch(err){
        toast.error(err.message);
      }
      finally{
        setOpenCancel(false)
      }
      };


      const closeRefund = () => {
        setRefundInfo(null);
        navigate('/home/mybookings');
      };

      const copyRef = async (ref) => {
        try {
          await navigator.clipboard.writeText(ref);
          toast.success("Refund ID copied");
        } catch {
          toast.error("Unable to copy");
        }
      };


      async function openAttendencePage(){
        const url = 'http://localhost:5173/organizer/attendance/'+booking.id;
          try {
    await navigator.clipboard.writeText(url);
    toast.success("Attendance link copied successfully!");
  } catch (error) {
    console.error("Failed to copy link:", error);
    toast.error("Unable to copy link");
  }
      }


    const venue = subVenue?.venue;
  const address1 = venue
    ? [venue.addressLine1, venue.city]
        .filter(Boolean)
        .join(", ")
    : "";

    const address2 = venue
    ? [venue.state, venue.country, venue.pincode]
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
       <button className="backBtn" onClick={() => navigate(-1)}> 
        &#8249; Back 
      </button>
            
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

          {/* {subVenue && (
            <div className="info-block">
              <span className="info-label">Venue</span>
              <p>
                <strong>{subVenue.subVenueName}</strong>
                <strong>{venue?.venueName && `, ${venue.venueName}`}</strong>
              </p>
              {address && <p className="info-muted">{address}</p>}
            </div>
          )} */}

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
      <br/>
      <div>
        <div className="qr-box">
        <img src={booking.bookingQrCode} />
         {subVenue && (
            <div className="info-block">
              <br></br>
              <span className="info-label">Venue</span>
              <p>
                <strong>{subVenue.subVenueName}</strong>
                <strong>{venue?.venueName && `, ${venue.venueName}`}</strong>
              </p>
              {address1 && <p className="info-muted">{address1}</p>}
              {address2 && <p className="info-muted">{address2}</p>}
              <br/>
               {/* <div>
              <span className="info-label">Booked Tickets</span>
              <p>{booking.totalCount}</p>
            </div> */}
            <button onClick={openAttendencePage}>Copy link to mark attendance</button>
            </div>

            
          )}
      </div>
               
{session.canCancel && tickets.length > 0 && <p style={{textAlign: "center", margin: "10px"}}><u>Do You want to cancel tickets? <strong style={{cursor: "pointer"}} onClick={() => setOpenCancel(true)} >click here</strong></u></p>}
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
      </>}

      {cancellations.length > 0 && (
        <>
          <h2 className="tickets-heading">Cancelled Tickets &amp; Refunds</h2>

          <div className="ticket-rows">
            {cancellations.map((c, index) => (
              <div key={c.id} className="ticket-row-card">
                <span className="ticket-number">{index + 1}</span>

                <div className="ticket-row-main">
                  <h3>
                    {c.ticketCount} ticket{c.ticketCount > 1 ? "s" : ""} cancelled
                  </h3>

                  {c.items?.map((it) => (
                    <p key={it.alias + it.unitPrice} className="info-muted">
                      {it.quantity} × {it.alias} (₹{it.unitPrice.toLocaleString("en-IN")} each)
                    </p>
                  ))}

                  <p className="info-muted">
                    Cancelled on {new Date(c.cancelledOn).toLocaleString("en-IN", fmt)}
                  </p>

                  <p className="info-muted">
                    Refund ID:{" "}
                    <strong>{c.refundRef || "will appear once the refund is created"}</strong>
                    {c.refundRef && (
                      <button
                        type="button"
                        onClick={() => copyRef(c.refundRef)}
                        style={{ marginLeft: 8, cursor: "pointer" }}
                      >
                        Copy
                      </button>
                    )}
                  </p>
                </div>

                <div className="ticket-row-side">
                  <strong>₹{c.refundAmount.toLocaleString("en-IN")}</strong>
                  <p className="info-muted">{refundLabel(c.refundStatus)}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "right", margin: "10px 0" }}>
            Total refund:{" "}
            <strong>
              ₹{cancellations
                .reduce((sum, c) => sum + c.refundAmount, 0)
                .toLocaleString("en-IN")}
            </strong>
          </p>
        </>
      )}
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

    <Dialog open={!!refundInfo} onClose={closeRefund}>
      <DialogTitle>Tickets cancelled</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography>
            Refund amount: <strong>₹{refundInfo?.refundAmount?.toLocaleString("en-IN")}</strong>
          </Typography>
          <Typography>
            Refund ID:{" "}
            <strong>{refundInfo?.refundRef || "not available yet, check My Bookings later"}</strong>
          </Typography>
          <Typography variant="body2">{refundStatusText(refundInfo?.refundStatus)}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        {refundInfo?.refundRef && <Button onClick={() => copyRef(refundInfo.refundRef)}>Copy ID</Button>}
        <Button variant="contained" onClick={closeRefund}>OK</Button>
      </DialogActions>
    </Dialog>

    </>
    )
}