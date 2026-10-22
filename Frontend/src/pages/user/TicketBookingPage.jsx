import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getBookingSummary, cancelBooking,  payForBooking } from "../../api/user";
import { toast } from "react-toastify";


const formatTime = (total) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function TicketBookingPage(){
    const {id} = useParams(); 
    const [summary, setSummary] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const expiryHandled = useRef(false);
    const navigate= useNavigate();

    useEffect(()=>{
        async function bookingSummary(){
           try{
            const data = await getBookingSummary(id);
            setSummary(data);
            setSecondsLeft(data.secondsLeft);
            console.log(data);
           }
           catch(err){
            toast.error("cannot get the summary");
           }
           finally{
            setLoading(false);
           }
        }

        bookingSummary();
    },[id])

    useEffect(() => {
    if (!summary || summary.status !== "PENDING") return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [summary]);


   useEffect(() => {
    if (!summary || summary.status !== "PENDING") return;
    if (secondsLeft > 0 && !summary.isExpired) return;
    if (expiryHandled.current) return;        
    expiryHandled.current = true;

    (async () => {
      try {
        await cancelBooking(id);
      } catch (err) {
        console.log(err.message);
      }
      toast.error("Payment time expired. Please select your tickets again.");
      navigate(`/home/event/tickets/${summary.sessionId}`, { replace: true }); 
    })();
  }, [summary, secondsLeft, id, navigate]);

   const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      await payForBooking(id);
      toast.success("Booking confirmed");
      const data = await getBookingSummary(id);   
      setSummary(data);
    } catch (err) {
      toast.error(err.message);                    
    } finally {
      setPaying(false);
    }
  };



     if (loading) return <p>Loading Summary</p>;
  if (!summary) return <p>Could not load this booking.</p>;

  const canPay = summary.status === "PENDING" && secondsLeft > 0 && !summary.isExpired;


    return (
        <>
         <div className="booking-summary-page">
      <h1>Booking Summary</h1>
      <p>Booking #{summary.bookingId}</p>
    <p>
        Status:{" "}
        <span className={`status-badge status-${summary.status.toLowerCase()}`}>
          {summary.status}
        </span>
      </p>

      {summary.status === "PENDING" && (
        <p className={`hold-timer ${secondsLeft <= 120 ? "urgent" : ""}`}>
          Complete payment within {formatTime(secondsLeft)}
        </p>
      )}

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

       <button disabled={!canPay || paying} onClick={handlePay}>
        {paying ? "Processing..." : "Pay now"}
      </button>
    </div>
        </>
    )
}