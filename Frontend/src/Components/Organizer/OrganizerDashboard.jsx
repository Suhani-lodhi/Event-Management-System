import '../Organizer/styles/OrganizerDashboard.css'
import { useEffect, useState } from "react";
import { deleteEventById, getAllEvents } from "../../api/event";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import DeleteDialog from './models/DeleteDialog';
import { toast } from 'react-toastify';
import { getImageSrc } from '../../utils/imageUrl';
import { EventStatusToggle } from './StatusToggles';

export default function OrganizerDashboard() {

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null);
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate();

  // derived from `events` so a status change shows up in the cards right away
  const filteredEvents =
    filter === "all" ? events : events.filter((event) => event.status === filter);


  async function fetchEvents() {
    try {
      const data = await getAllEvents();
      setEvents(data.event ? data.event : []);
    }
    catch (err) {
      console.log("error occurred in get all events")
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {

    fetchEvents();
  }, [])

  async function deleteEvent(id) {
    const res = await deleteEventById(id);
    // console.log(res)
    if (res.success) {
      await fetchEvents()
      toast.success("Event deleted successfully");
    }
    else{
      toast.error("Something went erong")
    }
  }

  function handleDeleteClick(id) {
    setEventToDelete(id);
    setDialogOpen(true);
  }

  function handleConfirmDelete() {
    setDialogOpen(false);
    deleteEvent(eventToDelete);
    setEventToDelete(null);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEventToDelete(null);
  }

  // called after the server accepted a new event status.
  // Draft and Closed also close registration on the server, so mirror that here.
  function handleStatusChange(eventId, status) {
    const closesRegistration = status === "DRAFTED" || status === "CLOSED";
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              status,
              sessions: closesRegistration
                ? ev.sessions?.map((s) => ({ ...s, registrationStatus: "CLOSED" }))
                : ev.sessions,
            }
          : ev
      )
    );
  }

  if (loading) return <p>Loading events...</p>;

  return (
    <>
      <div className="od-page">
        <div className="od-banner">
          <div className="od-banner-text">
            <h2>Ready to host your event?</h2>
          </div>
          <button type="button" className="od-banner-btn" onClick={() => navigate('/dashboard/createEvent')}>
            Create Event
          </button>
        </div>


        <div className="od-overview-header">
          <div>
            <h1>Your Events</h1>
          </div>
        </div>


        <div>
          <select onChange={(e) => setFilter(e.target.value)} value={filter}>
            <option value="all">All</option>
            <option value="DRAFTED">Draft</option>
            <option value="COMING_SOON">Up-coming</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>


        {loading ? (
          <p className="od-loading">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <div className='od-empty'>
            <p>No events yet. Want to create one?</p>
            <button onClick={() => navigate("/dashboard/createEvent")} >Create Event</button>
          </div>
        ) : (
          <div className="od-event-list">
            {filteredEvents.map((event) => {
              const sessionCount = event.sessions?.length ?? 0;
              const openCount =
                event.sessions?.filter((s) => s.registrationStatus === "OPEN").length ?? 0;

              return (
              <div className="od-event-card" key={event.id}  >
                
                <div className="od-event-image">
  {event.imageUrl ? (
    <img
      src={getImageSrc(event.imageUrl)}
      alt={event.Title}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none"; // hide broken image
      }}
    />
  ) : (
    <div className="od-image-placeholder">No image</div>
  )}
</div>




                <div className="od-event-main">
                  <div className="od-event-top">
                    <div>
                      <h3>{event.Title}</h3>
                      <span className={`od-status od-status-${event.status?.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className='od-icon'>
                      <FontAwesomeIcon icon={faEye} onClick={() => navigate('/dashboard/event/' + event.id)} className='od-icon-element' />
                      <FontAwesomeIcon icon={faTrash} style={{ color: "#5d5c5c" }} onClick={() => handleDeleteClick(event.id)} />
                    </div>
                  </div>

                  <p className="od-event-description">{event.Description}</p>

                  <div className="od-event-tags">
                    {event.category && (
                      <span className="od-tag">{event.category}</span>
                    )}
                    {event.genre && (
                      <span className="od-tag">{event.genre}</span>
                    )}
                  </div>

                  <EventStatusToggle
                    eventId={event.id}
                    status={event.status ?? "DRAFTED"}
                    onChange={(status) => handleStatusChange(event.id, status)}
                  />

                  {sessionCount > 0 && (
                    <p className="st-note">
                      Registration open for {openCount} of {sessionCount} session{sessionCount > 1 ? "s" : ""}
                    </p>
                  )}

                </div>

                <span className="od-event-arrow">&#8250;</span>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}