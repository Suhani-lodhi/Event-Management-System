import { useEffect, useState } from "react";
import { getAllBookings } from "../../api/user"
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getImageSrc } from "../../utils/imageUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye } from "@fortawesome/free-solid-svg-icons";
import '../user/styles/MyBookings.css'

export default function MyBookings(){
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();
    useEffect(()=>{
        async function getBookings(){
            try{
                const res = await getAllBookings();
                console.log(res);
                setBookings(res.bookings);
                console.log(bookings)
            }
            catch(err){
                console.log(err);
                toast.error("could not get bookings")
            }
            finally{
                setLoading(false)
            }
        }

        getBookings();
    },[]);


    if(loading) return <p>Loading your bookings</p>
    return (
        <>
       <div className="my-bookings">
  <h1>My Bookings</h1>

  {bookings?.length === 0 ? (
    <p className="my-bookings-empty">You have no bookings yet.</p>
  ) : (
    <div className="my-bookings-block">
      {bookings?.map((b) => {
  const venue = b.subVenue?.venue;
  const start = new Date(b.session.startDateTime);
  const end = new Date(b.session.endDateTime);
  const fmt = { dateStyle: "medium", timeStyle: "short" };

  return (
    <div key={b.id} className="booking-card">
      <div>
        {b.event.imageUrl && (
        <img
          className="booking-card-img"
          src={getImageSrc(b.event.imageUrl)}
          alt={b.event.Title}
          onClick={() => navigate('/home/getEvent/'+b.event.id)}
        />
      )}
      </div>

      <div className="booking-card-body">
        <div className="booking-card-head">
          <h3 onClick={() => navigate('/home/getEvent/'+event.id)} style={{cursor: "pointer"}}>{b.event.Title.trim()}</h3>
          <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
        </div>

        <p className="booking-card-date">
          {start.toLocaleString("en-IN", fmt)} – {end.toLocaleString("en-IN", fmt)}
        </p>

        {b.subVenue && (
          <div className="booking-card-venue">
            <p className="venue-name">
              {b.subVenue.subVenueName}
              {venue?.venueName && `, ${venue.venueName}`}
            </p>
            {venue && (
              <p className="venue-address">
                {[venue.addressLine1, venue.city, venue.state, venue.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="booking-card-foot">
          <span>
            {/* {b.totalCount} ticket{b.totalCount > 1 ? "s" : ""} */}
          </span>
         <p onClick={()=> navigate('/home/bookings/'+b.id+'/tickets')} style={{cursor: "pointer"}}>View Bookings<FontAwesomeIcon icon={faEye}/></p>
        </div>
      </div>
    </div>
  );
})}
    </div>
  )}
</div>
        </>
    )
}