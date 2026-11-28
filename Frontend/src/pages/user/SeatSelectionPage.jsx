import { useEffect, useMemo, useState } from "react";
import { KerusiSeatmap } from "@kerusiweb/react";
import "@kerusiweb/react/styles.css";

import "../user/styles/SeatGrid.css";
import { getSeatMap } from "../../api/user";
import { useNavigate, useParams } from "react-router-dom";

export default function SeatSelectionPage() {
  const { sessionId } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [map, setMap] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings , setSettings] = useState(null)
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchSeatMap() {
      try {
        setLoading(true);
        setError("");

        const response = await getSeatMap(sessionId);
        if (!isMounted) return;

        setMap(response.data.map);
        setState(response.data.state);
        setSettings(response.data.settings);
        console.log(response.data.settings)
      } catch (err) {
        console.error("Seat map error:", err);
        if (isMounted) {
          setError(err.response?.data?.message || err.message || "Unable to fetch seat layout");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (sessionId) fetchSeatMap();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const seatLookup = useMemo(() => {
    const lookup = {};
    if (!map) return lookup;

    const legendLabels = Object.fromEntries(
      (map.legend ?? []).map((item) => [item.id, item.label ?? item.id])
    );

    for (const section of map.sections ?? []) {
      for (const seat of section.seats ?? []) {
        lookup[seat.id] = legendLabels[seat.type] ?? seat.type;
      }
    }
    return lookup;
  }, [map]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const id of selectedSeats) {
      const category = seatLookup[id] ?? "Other";
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }, [selectedSeats, seatLookup]);


  const handleSelectionChange = (newSelection) => {
    setSelectedSeats(newSelection);
  };

  
function handleNext() {
  navigate(`/home/event/tickets/${sessionId}/booking`, { state: { selectedSeats, settings, movie: true } } )
}


  if (loading) return <div>Loading seat layout...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!map || !state) return <div>Seat layout is not available.</div>;


  return (
    <div className="seat-test-page">
      <div className="seat-map-container">
        <h2>Select Your Seats</h2>

        <KerusiSeatmap
          map={map}
          state={state}
          selection={selectedSeats}
          onSelectionChange={handleSelectionChange}
          maxSelection={10}
          showLegend
          zoomable
          maximizable
        />
      </div>

      <div className="selection-summary">
        <div className="selection-header">
          <h3>Selected Seats</h3>
          <p className="info">You can select maximum 10 seats in one booking</p>
          <p className="info">{settings.booking.cancellationAllowed? "* Cancellation Allowed": "* Cancellation not allowed"}</p>
          <p className="info">{settings.booking.cancellationAllowed && "* Partial Cancellation Not Allowed"}</p>

        </div>

        {selectedSeats.length === 0 && <p className="empty-message">No seats selected</p>}

        {selectedSeats.length > 0 && (
          <div className="category-counts">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <p key={category} className="category-count">
                <span>{category}</span>
                <span>× {count}</span>
              </p>
            ))}
          </div>
        )}

        <p>Total Seats: {selectedSeats.length}</p>

        <button
          type="button"
          onClick={() => setSelectedSeats([])}
          disabled={selectedSeats.length === 0}
        >
          Clear Selection
        </button>
        <button type="button" disabled={selectedSeats.length === 0} onClick = {handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}