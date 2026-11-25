import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSeatMap } from "../../api/user";
import SeatGrid from "./model/SeatGrid";
import { toast } from "react-toastify";

const MAX_SEATS = 6;

export default function SeatSelectionPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [layout, setLayout] = useState({ columnCount: 0, rowCount: 0, categories: [] });
    const [seats, setSeats] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");


    const loadSeats = useCallback(async () => {
        try {
            const data = await getSeatMap(sessionId);
            console.log(data);
            setSession(data.session);
            setLayout(data.layout);
            setSeats(data.seats);
            setSelectedIds((ids) =>
                ids.filter((id) => data.seats.find((s) => s.id === id)?.status === "AVAILABLE"))

        }
        catch (err) {
            console.log(err)
        }
        finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        loadSeats();
        const timer = setInterval(loadSeats, 8000);  
        return () => clearInterval(timer);
    }, [loadSeats]);

    const toggleSeat = (seat) => {
        setError("");
        setSelectedIds((ids) => {
            if (ids.includes(seat.id)) return ids.filter((id) => id !== seat.id);
            if (ids.length >= MAX_SEATS) {
                setError(`You can select up to ${MAX_SEATS} seats`);
                return ids;
            }
            return [...ids, seat.id];
        });
    };

    const selectedSeats = seats.filter((s) => selectedIds.includes(s.id));
    const total = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

    const proceed = async () => {
        
    };

    if (loading) return <p>Loading seats…</p>;
    if (!session) return <p>{error || "Showtime not found"}</p>;

    const { event, subVenue, startDateTime } = session;

    return (
        <div className="seat-page">
            <header className="seat-header">
                <h2>{event.Title}</h2>
                <p>
                    {subVenue.venue.venueName}, {subVenue.venue.city} · {subVenue.subVenueName} ·{" "}
                    {new Date(startDateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
            </header>

            <SeatGrid
                seats={seats}
                columns={layout.columnCount}
                selectedIds={selectedIds}
                onToggle={toggleSeat}
            />

            {error && <p className="error" role="alert">{error}</p>}

            <div className="booking-bar">
                <span>
                    {selectedSeats.length
                        ? `${selectedSeats.map((s) => `${s.rowName}${s.columnName}`).join(", ")} · ₹${total}`
                        : "Select your seats"}
                </span>
                <button disabled={!selectedIds.length || submitting} onClick={proceed}>
                    {submitting ? "Reserving…" : `Pay ₹${total}`}
                </button>
            </div>
        </div>
    );
}


