import '../Organizer/styles/Step1EventForm.css'
import ConfirmCreateDialog from './models/ConfirmCreateDialog'
import { useState } from 'react';

export default function Step1EventForm({setStep}){


  const [confirmOpen, setConfirmOpen] = useState(false);

  function handlePublishClick() {
    setConfirmOpen(true); // open dialog instead of submitting right away
  }

  function handleConfirmPublish() {
    setConfirmOpen(false);
    submitEvent(); // your actual submit logic goes here
  }


    function submitEvent(formdata){
      console.log("submit event called")
        setStep((prev)=> prev+1)
        //console.log(formdata)
    }
    return (
        <>
        <div className="ce-form-page">
  <div className="ce-form-header">
    <h1>Create an event</h1>
    <p>A few quick details stand between you and a published event.</p>
  </div>

  <form action={SubmitEvent}>

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