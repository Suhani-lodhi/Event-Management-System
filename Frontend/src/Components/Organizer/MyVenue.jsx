import { useEffect, useState } from "react";
import "../Organizer/styles/OrganizerDashboard.css";
import "../Organizer/styles/MyVenues.css";
import { deleteVenueById, getVenuesOfOrganizer } from "../../api/event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MyVenue() {
  const [venues, setVenues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function getVenues() {
      try {
        const data = await getVenuesOfOrganizer();
        setVenues(data.venues ?? []);
      } catch (err) {
        console.error(err);
      }
    }

    getVenues();
  }, []);

  async function deleteVenue(id){
  console.log("deleted venue", id);
  try{
    const data = await deleteVenueById(id);
    console.log(data);
    if(data.success){
      setVenues((prev)=> prev.filter((p)=> p.id !== id));
      toast.success("Venue deleted successfully")
    }
    else{
      toast.error("Something went wrong can't delete venue")
    }
  }
  catch(err){
    console.log(err);
    toast.error("Something went wrong can't delete venue")
  }
  }

  async function viewVenue(id){
    navigate('/dashboard/venue/'+id)
  }

  return (
    <div className="mv-page">

      {venues.length === 0 ? (
        <p>You haven't added any venues yet.</p>
      ) : (
        <div className="mv-grid">
          {venues.map((v) => (
            <div className="mv-card" key={v.id}>
              <div className="mv-header">
                  
                  <h3 className="mv-title">{v.venueName}</h3>
                  <div>
                    <FontAwesomeIcon icon={faTrash} className="icon" onClick={() => deleteVenue(v.id)}/>
                    <FontAwesomeIcon icon={faEye} className="icon" onClick={() => viewVenue(v.id)}/>
                  </div>
              </div>

              <p className="mv-address">{v.addressLine1}</p>
              <p className="mv-address">
                {v.city}, {v.state}, {v.country} - {v.pincode}
              </p>

              <p className="mv-count">
                <strong>Sub-venues:</strong> {v.subVenueCount}
              </p>

              {v.subVenues?.length > 0 && (
                <ul className="mv-subvenues">
                  {v.subVenues.map((sv) => (
                    <li key={sv.id}>
                      {sv.subVenueName || "Unnamed sub-venue"}
                      {" | "}Categories: {sv.categoryCount}
                      {sv.capacity != null && <> | Capacity: {sv.capacity}</>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}