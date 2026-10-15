import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventDetailsForUser } from "../../../api/user.jsx";
import { getImageSrc } from "../../../utils/imageUrl.jsx";
import "../Styles/EventDetails.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRegistrationState(session, eventStatus) {
  const now = new Date();
  const regStart = new Date(session.regStartdateTime);
  const regEnd = new Date(session.regEndDateTime);

  if (eventStatus === "CLOSED") {
    return { state: "closed", label: "Registration closed" };
  }
  if (now < regStart) {
    return { state: "upcoming", label: `Registration opens ${formatDate(regStart)}` };
  }
  if (now > regEnd || session.registrationStatus === "CLOSED") {
    return { state: "closed", label: "Registration closed" };
  }
  return { state: "open", label: `Register by ${formatDate(regEnd)}` };
}

function getVenueLine(session) {
  const venue = session.subVenue?.venue;
  return [venue?.venueName, session.subVenue?.subVenueName, venue?.city]
    .filter(Boolean)
    .join(", ");
}

export default function ParticipantEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await getEventDetailsForUser(id);
        setEvent(data.event);
      } catch (err) {
        console.log("error occurred while getting event details");
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  function handleBook(sessionId) {

    navigate(`/events/${id}/book/sessionId`);
  }

  if (loading) return <p className="loading">Loading event...</p>;

  if (error || !event) {
    return (
      <div className="page">
        <div className="empty">
          <p>We couldn't load this event. It may have been removed.</p>
          <button className="btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }


  const sessions = [...(event.sessions ?? [])].sort(
    (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  );

  return (
    <div className="page">
      <button className="backBtn" onClick={() => navigate("/user")}> 
        {/* // mere hisaab se nagvigate(-1) we have other pages apart from the/user reidrecting  to /getEvent/1 */}
        &#8249; Back to events
      </button>

    {console.log(event)}
    {event.imageUrl && (
    <div className="banner">
      <img
        src={getImageSrc(event.imageUrl)}
        alt={event.Title}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
    )}
    {/* {console.log(getImageSrc(event.imageUrl))} */}

      <div className="card">
        <div className="titleRow">
          <h1>{event.Title}</h1>
          {event.status && (
            <span className={`status ${event.status.toLowerCase()}`}>
              {event.status}
            </span>
          )}
        </div>

        <div className="tags">
          {event.category && <span className="tag">{event.category}</span>}
          {event.genre && <span className="tag">{event.genre}</span>}
        </div>

        {event.Description && (
          <>
            <h2 className="sectionTitle">About this event</h2>
            <p className="description">{event.Description}</p>
          </>
        )}

        {event.organizer?.displayName && (
          <p className="organizer">
            Hosted by <strong>{event.organizer.displayName}</strong>
            {event.organizer.companyName && ` (${event.organizer.companyName})`}
          </p>
        )}
      </div>

      {/* Sessions */}
      <div className="sessionsHeader">
        <h2 className="sectionTitle">Sessions</h2>
        <span className="count">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="empty">
          <p>Sessions will be announced soon.</p>
        </div>
      ) : (
        <div className="sessionGrid">
          {sessions.map((session, index) => {
            const reg = getRegistrationState(session, event.status);
            const venueLine = getVenueLine(session);
            const start = new Date(session.startDateTime);

            return (
              <div className="sessionCard" key={session.id}>
                <div className="sessionTop">
                  <div className="sessionDate">
                    <strong>{start.toLocaleDateString("en-IN", { day: "numeric" })}</strong>
                    <span>{start.toLocaleDateString("en-IN", { month: "short" })}</span>
                  </div>

                  <div className="sessionInfo">
                    <h3>Session {index + 1}</h3>
                    <p>
                      {formatDate(session.startDateTime)}, {formatTime(session.startDateTime)} - {" "} {formatDate(session.endDateTime)}, {formatTime(session.endDateTime)}
                    </p>
                    {venueLine && <p>{venueLine}</p>}
                  </div>
                </div>

                <div className="sessionBottom">
                  <span className={`regBadge ${reg.state}`}>{reg.label}</span>
                  <button
                    className="btn"
                    // disabled={reg.state !== "open"}
                    onClick={() => handleBook(session.id)}
                  >
                    Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}