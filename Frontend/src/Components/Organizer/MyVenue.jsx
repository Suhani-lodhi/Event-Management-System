import { useEffect, useState } from "react";
import "../Organizer/styles/OrganizerDashboard.css";
import "../Organizer/styles/MyVenues.css";
import { getVenuesOfOrganizer } from "../../api/event";

export default function MyVenue() {
  const [venues, setVenues] = useState([]);

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

  return (
    <div className="mv-page">

      {venues.length === 0 ? (
        <p>You haven't added any venues yet.</p>
      ) : (
        <div className="mv-grid">
          {venues.map((v) => (
            <div className="mv-card" key={v.id}>
              <h3 className="mv-title">{v.venueName}</h3>

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