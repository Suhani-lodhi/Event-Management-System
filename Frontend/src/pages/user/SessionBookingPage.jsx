import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { getPricingDetailsOfSession } from "../../api/user";

export default function SessionBookingPage(){  
   const {id} = useParams();
   const [ticketDetails, setTicketDetails] = useState([]);
   const [loading, setLoading] = useState(true);
   const [addTicket, setAddTicket] = useState(0)

   useEffect(()=>{
    async function getPricingDetails(){
       try{
         const data = await getPricingDetailsOfSession(id);
        console.log(data.categories);
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

    return (
        <>
         <div className="session-booking">
      <h1>Select Tickets</h1>

      <div className="ticket-list">
        {ticketDetails.map((ticket) => {
          const soldOut = ticket.seatsForSale <= 0;

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
              <div>
                <button>add</button>
              </div>



              </div>
            </div>
          );
        })}
      </div>
    </div>
        </>
    )
}