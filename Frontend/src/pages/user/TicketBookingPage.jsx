import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getBookingSummary, createPaymentOrder, payForBooking } from "../../api/user";
import { toast } from "react-toastify";
import '../user/styles/TicketBookingPage.css';

const PAYMENT_WINDOW_SECONDS = 5 * 60;

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
  const { state } = useLocation();
  const items = state?.items;                 
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [bookedId, setBookedId] = useState(null);   

  const backToSelection = () =>
    navigate(`/home/event/tickets/${sessionId}`, { replace: true });


  useEffect(() => {
    if (!items || items.length === 0) {
      navigate(`/home/event/tickets/${sessionId}`, { replace: true });   
      return;
    }

    async function load() {
      try {
        const data = await getBookingSummary({ sessionId, items });
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
    if (!summary || bookedId || paying || secondsLeft > 0) return;
    toast.error("Payment time expired. Please select your tickets again.");
    backToSelection();
  }, [secondsLeft, summary, bookedId, paying]);



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
      // 1. backend works out the price and creates the Razorpay order
      const order = await createPaymentOrder({ sessionId, items });

      // 2. build the Razorpay popup
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Occasia",
        description: "Ticket booking",

        // runs only if the payment succeeded
        handler: async (response) => {
          try {
            const data = await payForBooking({
              sessionId,
              items,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Booking confirmed");
            setBookedId(data.bookingId);
          } catch (err) {
            toast.error(err.message);
            if (err.status === 409) backToSelection();
          } finally {
            setPaying(false);
          }
        },

        // user closed the popup without paying
        modal: { ondismiss: () => setPaying(false) },
      });

      // bank declined or payment failed
      rzp.on("payment.failed", (r) => {
        toast.error(r.error.description || "Payment failed");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message);
      setPaying(false);   // no finally: the popup is async, its callbacks reset "paying"
      if (err.status === 409) backToSelection();
    }
  };

  function handleCancel(){
       backToSelection();
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