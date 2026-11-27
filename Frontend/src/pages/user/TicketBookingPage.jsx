import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { confirmMovieBooking, getBookingSummary, getMovieBookingSummary, payForBooking, payForMovieTickets } from "../../api/user";
import { toast } from "react-toastify";
import '../user/styles/TicketBookingPage.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import { faInfo } from "@fortawesome/free-solid-svg-icons";
const PAYMENT_WINDOW_SECONDS = 0.5 * 60;

const formatTime = (total) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function TicketBookingPage() {
  const { id } = useParams();                 
  const sessionId = id;
  console.log(sessionId)
  const { state } = useLocation();
  const items = state?.items;
  const selectedSeats = state?.selectedSeats;                 
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [bookedId, setBookedId] = useState(null);   
  const [settings, setSettings] = useState(state?.settings)

  const hasItems = Array.isArray(items) && items.length > 0;
  const hasSeats = Array.isArray(selectedSeats) && selectedSeats.length > 0;



  const backToSelection = () =>
    hasItems ? navigate(`/home/event/tickets/${sessionId}`, { replace: true }): navigate(`/home/sessions/${sessionId}/seats`);


  useEffect(() => {

  if (!hasItems && !hasSeats) {
    hasItems ? navigate(`/home/event/tickets/${sessionId}`, { replace: true }): navigate(`/home/sessions/${sessionId}/seats`);
    
    return;
  }

    async function load() {
      try {
        const data = hasItems
        ? await getBookingSummary({ sessionId, items })
        : await getMovieBookingSummary({ sessionId, selectedSeats });

      setSummary(data);
        setSecondsLeft(PAYMENT_WINDOW_SECONDS);   
      } catch (err) {
        toast.error(err.message);
        backToSelection();
      } finally {
        setLoading(false);
      }
    }
    load();
   
  }, [sessionId]);


  useEffect(() => {
    if (!summary || bookedId) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [summary, bookedId]);


  useEffect(() => {
    if (!summary || bookedId || secondsLeft > 0) return;
    toast.error("Payment time expired. Please select your tickets again.");
    backToSelection();
  }, [secondsLeft, summary, bookedId]);



  useEffect(() => {
  if (!summary || bookedId) return;          

  const handler = (e) => {
    e.preventDefault();
    e.returnValue = "";                       
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [summary, bookedId]);


  
  
  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      // const data = hasItems? await payForBooking({ sessionId, items }): await payForMovieTickets({sessionId, selectedSeats});
      // toast.success("Booking confirmed");
      // setBookedId(data.bookingId);

      if(hasItems){
         const data = await payForBooking({ sessionId, items })
          toast.success("Booking confirmed");
         setBookedId(data.bookingId);
      }
      else{
        await payForMovieTickets({sessionId, selectedSeats});
        const data = await confirmMovieBooking({sessionId, selectedSeats});
        setBookedId(data.bookingId);
      }
    } catch (err) {
      toast.error(err.message);
      if (err.status === 409) backToSelection();   
    } finally {
      setPaying(false);
    }
  };

  function handleCancel(){
       backToSelection();
  }

  function infoMessage(){
    let message= "";
    if(settings?.booking?.cancellationAllowed){
      message+= "Cancellation is allowed for the following booking. "
    }
    else{
      message+= "Cancellation is not allowed for the following booking. "
    }
    if(settings?.booking?.refundAllowed){
      message+= `If cancelled then you will get ${settings?.booking?.refundPercentage}% of the booking amount.`
    }
    else{
      message+= "Refund is not allowed for the following booking. "
    }

    return message;
  }

  if (loading) return <p>Loading Summary</p>;
  if (!summary) return null;

  
  if (bookedId) {
    return (
      <div className="booking-summary-page">
        <h1>Booking Confirmed</h1>
        <p>Booking #{bookedId}</p>
        <p>
          <span className="status-badge status-confirmed">CONFIRMED</span>
        </p>
        <div className="summary-total">
          <p>Total tickets: {summary.totalCount}</p>
          <h2>Paid: ₹{summary.totalAmount.toLocaleString("en-IN")}</h2>
        </div>
        <button onClick={() => navigate("/home")}>Back to home</button>
      </div>
    );
  }

  return (
    <>
   
    <div className="booking-summary-page">
      
      <h1>Booking Summary</h1>

      <p className={`hold-timer ${secondsLeft <= 120 ? "urgent" : ""}`}>
        Complete payment within {formatTime(secondsLeft)}
      </p>

      <div className="summary-items">
        {summary.items.map((item) => (
          <div key={item.sessionCategoryPriceId} className="summary-row">
            <div>
              <h3>{item.alias}</h3>
              <p>
                ₹{item.unitPrice.toLocaleString("en-IN")} × {item.quantity}
              </p>
            </div>
            <p>₹{item.subtotal.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      <div className="summary-total">
        <p>Total tickets: {summary.totalCount}</p>
        <h2>Total: ₹{summary.totalAmount.toLocaleString("en-IN")}</h2>
      </div>

      <div style={{
        display: "flex",
        gap: "5px",
        padding: "15px",
        fontStyle: "italic",
        color: "grey",
        fontSize: "15px"
      }}>
        <FontAwesomeIcon icon={faInfo} className="info-icon" />
        <span>
            {infoMessage()}
        </span>
      </div>

      <div>
        <button disabled={paying || secondsLeft === 0} onClick={handlePay}>
        {paying ? "Processing..." : "Pay now"}
      </button>
      <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
    </>
  );
}