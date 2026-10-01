import '../Organizer/styles/Step1EventForm.css'
import ConfirmCreateDialog from './models/ConfirmCreateDialog'
import { useRef, useState } from 'react';
import { createEvent } from '../../api/event';

export default function Step1EventForm({setStep, setEventId}){

  const formRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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


    async function submitEvent(){
      console.log("submit event called")
      const formdata = new FormData(formRef.current);

      const eventData = {
        Title: formdata.get('title'),
        Description: formdata.get('description'),
        category: formdata.get('category'),
        genre: formdata.get('genre')
      }
      console.log(eventData)
      const isAdded =await createEvent(eventData);
      console.log(isAdded.res.data.id)
      setEventId(isAdded.res.data.id);
      if(isAdded.status){
        alert("event added successfully")
      }
        setStep((prev)=> prev+1)
    }
    return (
        <>
        <div className="ce-form-page">
  <div className="ce-form-header">
    <h1>Create an event</h1>
    <p>A few quick details stand between you and a published event.</p>
  </div>

  <form ref={formRef}>

<div className="ce-card">
    <div className="ce-field-plain">
      <label htmlFor="title">Event Title </label>
      <input
        id="title"
        type="text"
        name="title"
        placeholder="Add Your event's name"
        required
      />
    </div>
</div>

    <div className="ce-card">
      <div className="ce-card-header">
        <label htmlFor="description">
          Event Description 
        </label>
      </div>
      <textarea
        id="description"
        placeholder="Your event's description"
        name="description"
        rows={6}
        required
      ></textarea>
    </div>


    <div className="ce-card">
      <div className="ce-card-header ce-card-header-stack">
        <label>
          Event type
        </label>
      </div>

      <div className="ce-row">
        <div className="ce-col">
          <div className="ce-field-label-row">
            <label htmlFor="category">
              Category
            </label>
    
          </div>
          <select id="category" name="category" defaultValue="" required>
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
          <select id="genre" name="genre" defaultValue="" required>
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
            <button type='button' onClick={handlePublishClick} >Create Event</button>

            <ConfirmCreateDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmPublish}
      />
            
        </div>
  </form>
</div>
        </>
    )
}