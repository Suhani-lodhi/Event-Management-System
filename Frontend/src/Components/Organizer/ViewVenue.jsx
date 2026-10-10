import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { getVenueDetails } from "../../api/event";
import '../Organizer/styles/MyVenues.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";


export default function ViewVenue(){
    const {id} = useParams();
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        async function getVenue(){
            try {
        const data = await getVenueDetails(id);
        setVenue(data.venue);
      } catch (err) {
        console.error(err);
        setVenue(null);
      } finally {
        setLoading(false);
      }
        }

        getVenue();
    },[id])


    async function deleteSubVenue(id){
        
    }


     if (loading) return <p>Loading venue...</p>;
  if (!venue) return <p>Venue not found.</p>;
    
    return (
        <>
           <div className="vd-page">

      <h1>Venue Details</h1>

      {/* Venue card */}
      <div className="vd-card">
        <div>
            <h2 className="vd-title">{venue.venueName}</h2>
        <button>Edit Venue</button>
        </div>

        <div className="vd-info">
          <p>
            <strong>Address:</strong> {venue.addressLine1}
          </p>
          <p>
            <strong>City:</strong> {venue.city}
          </p>
          <p>
            <strong>State:</strong> {venue.state}
          </p>
          <p>
            <strong>Country:</strong> {venue.country}
          </p>
          <p>
            <strong>Pincode:</strong> {venue.pincode}
          </p>
          <p>
            <strong>Sub-venues:</strong> {venue.subVenueCount}
          </p>
        </div>
      </div>

      {/* Sub-venue cards */}
      <h2 className="vd-section-title">Sub-Venues</h2>

      {venue.subVenues?.length > 0 ? (
        <div className="vd-grid">
          {venue.subVenues.map((sv) => (
            <div className="vd-subcard" key={sv.id}>
              <div>
                <h3>{sv.subVenueName || "Unnamed sub-venue"}</h3>
                <FontAwesomeIcon icon={faTrash} onClick={() => deleteSubVenue(sv.id)} />
              </div>
              <p>
                <strong>Categories:</strong> {sv.categoryCount}
              </p>
              <p>
                <strong>Capacity:</strong> {sv.capacity ?? "-"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No sub-venues added.</p>
      )}
    </div>
        </>
    )
}