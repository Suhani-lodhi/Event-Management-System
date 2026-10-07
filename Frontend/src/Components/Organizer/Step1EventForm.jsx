import '../Organizer/styles/Step1EventForm.css'
import ConfirmCreateDialog from './models/ConfirmCreateDialog'
import { useEffect, useRef, useState } from 'react';
import { createEvent, getEventDetails, updateEvent } from '../../api/event';
import { toast } from 'react-toastify';

export default function Step1EventForm({ setStep, setEventId, id }) {
  const formRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)); // only show loading if editing

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    genre: "",
  });

  useEffect(() => {
    if (!id) return; // create mode — nothing to fetch

    async function getDataForEdit() {
      try {
        const data = await getEventDetails(id);
        setEventData({
          title: data.event.Title,
          description: data.event.Description,
          category: data.event.category,
          genre: data.event.genre,
        });
        setEventId(id);
      } catch (err) {
        console.log("could not load event for editing");
      } finally {
        setLoading(false);
      }
    }

    getDataForEdit();
  }, [id]);

  function updateField(field, value) {
    setEventData((prev) => ({ ...prev, [field]: value }));
  }

  function handlePublishClick() {
    const form = formRef.current;
    if (!form.reportValidity()) {
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmPublish() {
    setConfirmOpen(false);
    submitEvent();
  }

  async function submitEvent() {
    const payload = {
      Title: eventData.title,
      Description: eventData.description,
      category: eventData.category,
      genre: eventData.genre,
    };

    try {
      if (id) {
        // edit mode — update the existing event
        await updateEvent(id, payload);
        toast.success("Event edited successfully")
        setEventId(id);
        // console.log("edit called")
      } else {
        // create mode — create a new event
        const isAdded = await createEvent(payload);
        setEventId(isAdded.res.data.event.id);
        toast.success("Event created Successfully")
      }
      setStep((prev) => prev + 1);
    } catch (err) {
      console.log(err)
      toast.error("Could not save event")
      console.error("could not save event");
    }
  }

  if (loading) return <p>Loading event details...</p>;

  return (
    <>
      <div className="ce-form-page">
        <div className="ce-form-header">
          <h1>{id ? "Edit Event" : "Create an event"}</h1>
          <p>A few quick details stand between you and a published event.</p>
        </div>

        <form ref={formRef}>
          <div className="ce-card">
            <div className="ce-field-plain">
              <label htmlFor="title">Event Title</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="Add Your event's name"
                value={eventData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="ce-card">
            <div className="ce-card-header">
              <label htmlFor="description">Event Description</label>
            </div>
            <textarea
              id="description"
              placeholder="Your event's description"
              name="description"
              rows={6}
              value={eventData.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            ></textarea>
          </div>

          <div className="ce-card">
            <div className="ce-card-header ce-card-header-stack">
              <label>Event type</label>
            </div>

            <div className="ce-row">
              <div className="ce-col">
                <div className="ce-field-label-row">
                  <label htmlFor="category">Category</label>
                </div>
                <select
                  id="category"
                  name="category"
                  value={eventData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  required
                >
                  <option value="" disabled>Select Category</option>
                  <option value="STANDUP">Standup</option>
                  <option value="ACTIVITY">Activity</option>
                  <option value="GAME">Game</option>
                  <option value="MOVIE">Movie</option>
                </select>
              </div>

              <div className="ce-col">
                <div className="ce-field-label-row">
                  <label htmlFor="genre">Genre</label>
                </div>
                <select
                  id="genre"
                  name="genre"
                  value={eventData.genre}
                  onChange={(e) => updateField("genre", e.target.value)}
                  required
                >
                  <option value="" disabled>Select Genre</option>
                  <option value="COMEDY">Comedy</option>
                  <option value="HORROR">Horror</option>
                  <option value="ACTION">Action</option>
                  <option value="FUN">Fun</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button type="button" onClick={handlePublishClick}>
              {id ? "Save Changes" : "Create Event"}
            </button>

            <ConfirmCreateDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={handleConfirmPublish}
              isEdit = {id ? true : false}
            />
          </div>
        </form>
      </div>
    </>
  );
}