import '../Organizer/styles/Step1EventForm.css'
import ConfirmCreateDialog from './models/ConfirmCreateDialog'
import { useEffect, useRef, useState } from 'react';
import { CreateEvent, getEventDetails, updateEvent } from '../../api/event';
import { toast } from 'react-toastify';
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Step1EventForm({ setStep, setEventId, id, createEvent }) {
  const formRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)); 
  const [image, setImage] = useState(null);      
const [preview, setPreview] = useState(null);
  const [settings, setSettings] = useState({
    entry: {
      idRequired: true,
      minimumAge: 18,
      ticketRequiredAboveAge: 5,
      reEntryAllowed: false
    },
    eventRules: {
      photographyRecordingAllowed: false,
      petsAllowed: false,
      outsideFoodAllowed: false,
      smokingAllowed: false
    },
    booking: {
      cancellationAllowed: true,
      refundAllowed: true,
      refundPercentage: 100
    }
  })

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    genre: "",
  });

  useEffect(() => {
    if (id){
        async function getDataForEdit() {
      try {
        const data = await getEventDetails(id);
        console.log(data);
        setEventData({
          title: data.event.Title,
          description: data.event.Description,
          category: data.event.category,
          genre: data.event.genre,
        });
        data.event.settings!=={} && setSettings(data.event.settings) ;
        if(data.event.imageUrl){
          setPreview(`${API_URL}${data.event.imageUrl}`)
        }
        else{
          setImage(null);
          setPreview(null);
        }
        setEventId(id);
      } catch (err) {
        console.log("could not load event for editing");
      } finally {
        setLoading(false);
      }
    }

    getDataForEdit();
    }
    else{
      setEventData({
      title: "",
      description: "",
      category: "",
      genre: "",
    });
    setEventId(null)
    setLoading(false);
    setImage(null);
    setPreview(null)
    }

   
  }, [id]);

  function updateField(field, value) {
    setEventData((prev) => ({ ...prev, [field]: value }));
  }

  function updateSetting (section, key, value){
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
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

  function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  console.log(file);

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    toast.error("Only JPG, PNG or WEBP images are allowed");
    e.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image must be smaller than 5 MB");
    e.target.value = "";
    return;
  }

  setImage(file);
  setPreview(URL.createObjectURL(file));
}

  // async function submitEvent() {
  //   const payload = {
  //     Title: eventData.title,
  //     Description: eventData.description,
  //     category: eventData.category,
  //     genre: eventData.genre,
  //   };

  //   try {
  //     if (id) {
  //       await updateEvent(id, payload);
  //       toast.success("Event edited successfully")
  //       setEventId(id);
  //     } else {
  //       const isAdded = await CreateEvent(payload);
  //       setEventId(isAdded.res.data.event.id);
  //       toast.success("Event created Successfully")
  //     }
  //     setStep((prev) => prev + 1);
  //   } catch (err) {
  //     console.log(err)
  //     toast.error("Could not save event")
  //     console.error("could not save event");
  //   }
  // }

  async function submitEvent() {
  const formData = new FormData();
  formData.append("Title", eventData.title);
  formData.append("Description", eventData.description);
  formData.append("category", eventData.category);
  formData.append("genre", eventData.genre);
  if (image) formData.append("image", image); 
  formData.append("settings", JSON.stringify(settings));

  console.log([...formData.entries()]);

  try {
    if (id) {
      const event = await updateEvent(id, formData);
      toast.success("Event edited successfully");
      setEventId(id);
    } else {
      const isAdded = await CreateEvent(formData);
      console.log("create event ----> ",isAdded.res.data.event.id)
      setEventId(isAdded.res.data.event.id);
      toast.success("Event created Successfully");
    }
    setStep((prev) => prev + 1);
  } catch (err) {
    console.error(err);
    toast.error("Could not save event");
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

          <div className='ce-card'>
            <div className='ce-card-header'>
              <label>Event card Image</label>
            <p className="ce-card-desc">
              Upload a landscape image for your event card.
            </p>
            </div>
            <div className="ce-upload-image">
              <div className="ce-upload-info">
                <div className="ce-upload-info-item">
                  <span className="ce-label">Landscape for website</span>
                  <span className="ce-value">16:9 aspect ratio (1600px by 900px)</span>
                </div>
                <div className="ce-upload-info-item">
                  <span className="ce-label">Max Size</span>
                  <span className="ce-value">1.5MB</span>
                </div>
              </div>

            <div className="ce-upload-actions">
              {preview && (
                <img src={preview} alt="Preview" className="ce-image-preview" />
              )}
              <label className="ce-file-btn">
                Choose File
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </label>
            </div>
            </div>
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


          {/* Settings of events */}
          <div className="ce-card">
            <div className="ce-card-header ce-card-header-stack">
              <label>Event Settings</label>
            </div>

            <div className='event-setting-section'>
              <h3>Entry and Eligibility</h3>
            <label>
              <input type='checkbox'
              checked={settings.entry.idRequired}
              onChange={(e)=>
                           updateSetting("entry", "idRequired", e.target.checked)
              }
              />
              ID proof required for the entry
            </label>

           <div className="form-group">
             <label>Minimum Age to atted the event</label>
            <input type='number'
            min="0"
            defaultValue={settings.entry.minimumAge}
            onChange={(e)=> updateSetting("entry", "minimumAge", Number(e.target.value))}
            />
           </div>

            <div className="form-group">
             <label>Ticket required above age</label>
            <input type='number'
            min="0"
            defaultValue={settings.entry.ticketRequiredAboveAge}
            onChange={(e)=> updateSetting("entry", "ticketRequiredAboveAge", Number(e.target.value))}
            />
           </div>

           <label>
              <input type='checkbox'
              checked={settings.entry.reEntryAllowed}
              onChange={(e)=>
                           updateSetting("entry", "reEntryAllowed", e.target.checked)
              }
              />
              Re-entry allowed
            </label>
            </div>


            <div className='event-setting-section'>
                 <h3>Event Rules and Restrictions</h3>
                  <label>
              <input type='checkbox'
              checked={settings.eventRules.photographyRecordingAllowed}
              onChange={(e)=>
                           updateSetting("eventRules", "photographyRecordingAllowed", e.target.checked)
              }
              />
              Is Photography and recording allowed?
            </label>


             <label>
              <input type='checkbox'
              checked={settings.eventRules.petsAllowed}
              onChange={(e)=>
                           updateSetting("eventRules", "petsAllowed", e.target.checked)
              }
              />
              Is event pet-friendly?
            </label>

             <label>
              <input type='checkbox'
              checked={settings.eventRules.outsideFoodAllowed}
              onChange={(e)=>
                           updateSetting("eventRules", "outsideFoodAllowed", e.target.checked)
              }
              />
              Is outside food allowed?
            </label>

             <label>
              <input type='checkbox'
              checked={settings.eventRules.smokingAllowed}
              onChange={(e)=>
                           updateSetting("eventRules", "smokingAllowed", e.target.checked)
              }
              />
              Smoking allowed?
            </label>
            </div>

            <div className='event-setting-section'>
              <h3>Booking and Cancellation</h3>
               <label>
              <input type='checkbox'
              checked={settings.booking.cancellationAllowed}
              onChange={(e)=>
                           updateSetting("booking", "cancellationAllowed", e.target.checked)
              }
              />
              Ticket cancellation allowed?
            </label>

            <label>
              <input type='checkbox'
              checked={settings.booking.refundAllowed}
              onChange={(e)=>
                           updateSetting("booking", "refundAllowed", e.target.checked)
              }
              />
              Refund available?
            </label>

            {
              settings.booking.refundAllowed && (
                <div className="form-group">
                  <label>Refund Percentage</label>

                  <input type="number" min="0" max="100" 
                  defaultValue={settings.booking.refundPercentage}
                  onChange={(e)=> updateSetting("booking", "refundPercentage", Number(e.target.value))} />
                </div>
              )
            }


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