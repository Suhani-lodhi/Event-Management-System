import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import {  getPricingDetailsOfSession} from "../../api/user";
import { toast } from "react-toastify";
import "../user/styles/SessionBookingPage.css"

const MAX_PER_CATEGORY = 10;  
const MAX_PER_BOOKING = 20;

export default function SessionBookingPage(){  
   const {id} = useParams();
   const [ticketDetails, setTicketDetails] = useState([]);
   const [loading, setLoading] = useState(true);
   const [addTicket, setAddTicket] = useState(0)
  const [quantities, setQuantities] = useState({});
  const navigate = useNavigate();

   useEffect(()=>{
    async function getPricingDetails(){
       try{
        // console.log(id)
         const data = await getPricingDetailsOfSession(id);
        // console.log(data.categories);
        setTicketDetails(data.categories);
       }
       catch(err){
        console.log("error occurred at booking page")
       }
       finally{
        setLoading(false);
       }
    }

    getPricingDetails();
   },[id])



   const totalCount = Object.values(quantities).reduce((s, q) => s + q, 0);
  const totalAmount = ticketDetails.reduce(
    (sum, t) => sum + Number(t.price) * (quantities[t.id] || 0),
    0
  );



    const increase = (ticket) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;
      const limit = Math.min(ticket.seatsForSale, MAX_PER_CATEGORY);
      const total = Object.values(prev).reduce((s, q) => s + q, 0);

      if (current >= limit || total >= MAX_PER_BOOKING) return prev; // no change
      return { ...prev, [ticket.id]: current + 1 };
    });


  };

  const decrease = (ticket) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [ticket.id]: current - 1 };
    });

  };


  async function handleProceed() {
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([sessionCategoryPriceId, quantity]) => ({
      sessionCategoryPriceId: sessionCategoryPriceId,
      quantity,
    }));

  if (items.length === 0) return;
  // console.log(id, items)

  // console.log(`home/event/tickets/${id}/booking`)
  navigate(`/home/event/tickets/${id}/booking`, { state: { items } });
}




    return (
        <>
         <div className="session-booking">
      <h1>Select Tickets</h1>

      <div className="ticket-list">
        {ticketDetails.map((ticket) => {
          console.log(ticket)
          const soldOut = ticket.seatsForSale <= 0;
          const qty = quantities[ticket.id] || 0;
          const atLimit =
            qty >= Math.min(ticket.seatsForSale, MAX_PER_CATEGORY) ||
            totalCount >= MAX_PER_BOOKING;

          return (
            <div
              key={ticket.id}
              className={`ticket-card ${soldOut ? "sold-out" : ""}`}
            >
              <div className="ticket-info">
                <h3>{ticket.alias}</h3>
                <p className="ticket-detail">
                  {ticket.seatCategory?.categoryDetail}
                </p>
                <p className="ticket-price">
                  ₹{Number(ticket.price).toLocaleString("en-IN")}
                </p>
              </div>

              <div>


                <div className="ticket-availability">
                {soldOut ? (
                  <span className="badge badge-soldout">Sold out</span>
                ) : ticket.seatsForSale <= 10 ? (
                  <span className="badge badge-low">
                    Only {ticket.seatsForSale} left
                  </span>
                ) : (
                  <span className="badge badge-available">
                    {ticket.seatsForSale} available
                  </span>
                )}
              </div>
             <div className="ticket-counter">
                  <button onClick={() => decrease(ticket)} disabled={qty === 0}>
                    −
                  </button>
                  <span>{qty}</span>
                  <button onClick={() => increase(ticket)} disabled={soldOut || atLimit}>
                    +
                  </button>
                </div>
               
              </div>
            </div>
          );
        })}

        <button onClick={() => handleProceed()} disabled={totalCount === 0}>Proceed</button>
      </div>
    </div>
        </>
    )
}