import { useState } from "react"

export default function CreateEvents() {

    const [step, setStep] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [regStartDate, setRegStartDate] = useState("");
    const [regEndDate, setRegEndDate] = useState("");

    console.log(step);

    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];


    function submitEvent(){
        console.log("submit event called")
    }

    return (
        <>
            <div className="ce-header">
  <h1>Create New Event</h1>

  <div className="ce-steps">
    <span className={step === 1 ? "active" : ""} onClick={() => setStep(1)}>
      <h4>Step 1</h4>
      <p>Basic Information</p>
    </span>
    <span className={step === 2 ? "active" : ""} onClick={() => setStep(2)}>
      <h4>Step 2</h4>
      <p>Sessions and Venue</p>
    </span>
    <span className={step === 3 ? "active" : ""} onClick={() => setStep(3)}>
      <h4>Step 3</h4>
      <p>Ticketing and pricing</p>
    </span>
    <span className={step === 4 ? "active" : ""} onClick={() => setStep(4)}>
      <h4>Step 4</h4>
      <p>Settings and Form</p>
    </span>
  </div>
</div>


    <form action={submitEvent}>
      {/* STEP 1: Basic information */}
      <div hidden={step !== 1}>
        <input type="text" name="title" placeholder="Title" />

        <textarea placeholder="Give description" name="description"></textarea>

        <select name="category" defaultValue="">
          <option value="" disabled>Select Category</option>
          <option value="STANDUP">Standup</option>
          <option value="ACTIVITY">Activity</option>
          <option value="GAME">Game</option>
          <option value="MOVIE">Movie</option>
        </select>

        <select name="genre" defaultValue="">
          <option value="" disabled>Select Genre</option>
          <option value="COMEDY">Comedy</option>
          <option value="HORROR">Horror</option>
          <option value="ACTION">Action</option>
          <option value="FUN">Fun</option>
        </select>

        <label>
          Start date:
          <input
            type="date"
            name="startDate"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End date:
          <input
            type="date"
            name="endDate"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        {/* <label>
          Registration start date:
          <input
            type="date"
            name="regStartDate"
            min={today}
            value={regStartDate}
            onChange={(e) => setRegStartDate(e.target.value)}
          />
        </label>

        <label>
          Registration end date:
          <input
            type="date"
            name="regEndDate"
            min={regStartDate || today}
            value={regEndDate}
            onChange={(e) => setRegEndDate(e.target.value)}
          />
        </label> */}
      </div>

      {/* STEP 2: Date, time, venue */}
      <div hidden={step !== 2}>
         <h2>Sessions</h2>
         <input type="text" name="title" placeholder="Title" />

        <textarea placeholder="Give description" name="description"></textarea>

        <select name="category" defaultValue="">
          <option value="" disabled>Select Category</option>
          <option value="STANDUP">Standup</option>
          <option value="ACTIVITY">Activity</option>
          <option value="GAME">Game</option>
          <option value="MOVIE">Movie</option>
        </select>

        <select name="genre" defaultValue="">
          <option value="" disabled>Select Genre</option>
          <option value="COMEDY">Comedy</option>
          <option value="HORROR">Horror</option>
          <option value="ACTION">Action</option>
          <option value="FUN">Fun</option>
        </select>
      </div>

      {/* STEP 3: Ticketing and pricing */}
      <div hidden={step !== 3}>
       
      </div>

      {/* STEP 4: Settings and forms */}
      <div hidden={step !== 4}>
        {/* add your step 4 fields here */}
      </div>

      {/* Navigation buttons */}
      <div>
        {step > 1 && (
          <button type="button" onClick={() => setStep((prev) => prev - 1)}>
            Back
          </button>
        )}

        {step < 4 ? (
          <button type="button" onClick={() => setStep((prev) => prev + 1)}>
            Next
          </button>
        ) : (
           <div>
            <button type="button">Draft Event</button>
            <button type="submit" className="btn-secondary">Publish Event</button>
           </div>
        )}
      </div>
    </form>

                

        </>
    )
}