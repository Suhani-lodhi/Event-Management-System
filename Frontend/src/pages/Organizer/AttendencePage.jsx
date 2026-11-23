import { useEffect, useState } from "react";
import "../user/styles/MyTickets.css"
import { useNavigate, useParams } from "react-router-dom"
import { cancelBooking, getTicketsByBookingId } from "../../api/user";
import { getImageSrc } from "../../utils/imageUrl";
import { toast } from "react-toastify";
import { getBookingDetails, markAttendance } from "../../api/event";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';



const fmt = { dateStyle: "medium", timeStyle: "short" };

export default function MyTickets(){

    const {id} = useParams();
    const [tickets, setTickets] = useState([])
    const [booking, setBooking] =useState(null);
    const [event, setEvent] = useState(null);
    const [session, setSession] = useState(null);
    const [subVenue, setSubVenue] = useState(null);
    const [ticketSummary, setTicketSummary] = useState([])
    const [refundDetails, setRefundDetails] = useState(null);
    const [loading, setLoading] = useState(true)
    const [cancelQty, setCancelQty] = useState({});
    const [openCancel, setOpenCancel] = useState(false);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

    useEffect(()=>{
       async function getTickets(){
        try{
           const res = await getBookingDetails(id);
           console.log(res);
           setTickets(res.tickets);
           setBooking(res.booking);
           setEvent(res.event);
           setSession(res.session);
           setSubVenue(res.subVenue);
           setTicketSummary(res.ticketSummary);
           setRefundDetails(res.refundSummary);
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
        toast.success(data);
        navigate('/home/mybookings')
      }
      catch(err){
        console.log(err);
        toast.error(err.message);
      }
      finally{
        setOpenCancel(false)
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



      async function handleMarkAttendance(){
         const res = await markAttendance(id);
         console.log(res);
         if(res.success){
            toast.success("Attendence marked successfully")
         }
         else{
            toast.error(res.msg)
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
              <p>{refundDetails.cancelledTickets}</p>
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
              <p><strong>₹{refundDetails.refundAmount}</strong></p>
            </div>
            </div>
            }
            
          </div>

        </div>
      </div>
      <br/>
      <div>
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
       {/* <Button onClick={handleMarkAttendance} className="attendance-btn">Mark Attendance</Button> */}

       <p  onClick={handleClickOpen} className="attendance-btn" ><u><b>Click here to mark attendence.</b></u></p>
    </div>


      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
            Mark Attendence
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is irreversible. Do you want to mark attendence??
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleMarkAttendance} autoFocus>
            Mark Attendence
          </Button>
        </DialogActions>
      </Dialog>

    </>
    )
}