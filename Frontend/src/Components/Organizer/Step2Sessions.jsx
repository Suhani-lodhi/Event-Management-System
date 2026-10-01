import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../Organizer/styles/Step1EventForm.css'
import { useEffect, useState } from 'react';
import { faCopy, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getSubVenues, getVenues, createSession } from '../../api/event';

export default function Step2Session(props) {
    
    const [sessions, setSessions] = useState([
    { id: 1, startDateTime: "", endDateTime: "",regStartDateTime:"", regEndDateTime:"", venueId: "", subVenueId: "" },
     ]);

    const [venues, setVenues] = useState([]);
    const [subVenues, setSubVenues] = useState([]);
    const [loadingVenue, setLoadingVenue] = useState(true);
    const [loadingSubVenues, setLoadingSubVenues] = useState(true);


 const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

  function addSession() {
    setSessions((prev) => [
      ...prev,
      { id: Date.now(), startDateTime: "", endDateTime: "", regStartDateTime:"", regEndDateTime:"", venueId: "", subVenueId: ""},
    ]);
  }

  function removeSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSession(id, field, value) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function copySession(id) {
  setSessions((prev) => {
    const index = prev.findIndex((s) => s.id === id);
    if (index === -1) return prev;

    const original = prev[index];
    const duplicate = { ...original, id: Date.now() };

    const updated = [...prev];
    updated.splice(index + 1, 0, duplicate); // insert right after the original
    return updated;
  });
}

useEffect(()=>{
  async function getVenue(){
       const data = await getVenues();
       console.log(data.venues);
       setVenues(data.venues)
       setLoadingVenue(false)
  }
  getVenue()
},[])

async function getSubvenue(id,e){
    updateSession(id, "venueId", e.target.value);
    const data = await getSubVenues(e.target.value);
    console.log(data.subVenues);
    if(data){
      setSubVenues(data.subVenues)
      setLoadingSubVenues(false)
    }
}


async function submitSession(){
    console.log("session formdata")
    const res = await createSession(props.eventId, sessions)
    if(res.status){
      alert("sessions created");
    }
}
   

    return (
        <>
            <div className="ce-form-page">
                <div className="ce-form-header ce-session-header">
                    <h1>Create Sessions</h1>
                    <button onClick={addSession}>Add sessions</button>
                </div>

                 <form action={submitSession}>
          {sessions.map((session, index) => (
            <div className="ce-card" key={session.id}>
              <div className="ce-card-header ce-session-card-header">
                <label>Session {index + 1}</label>

                 <div>
                    {sessions.length > 1 && (
                  <FontAwesomeIcon icon={faTrash}
                  className='session-icon'
                  type="button"
                    onClick={() => removeSession(session.id)}
                  />

                )}
                <FontAwesomeIcon icon={faCopy} 
                 className='session-icon'
                 type="button"
                    onClick={() => copySession(session.id)}
                />
                 </div>
            
              </div>

              <div className="ce-row">
                <div className="ce-col">
                  <div className="ce-session-element">
                    <label htmlFor={`startDate-${session.id}`} >
                      Start Date and Time
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    id={`startDate-${session.id}`}
                    defaultValue={session.startDateTime}
                    className='startDate'
                    min={today}
                    onChange={(e) =>
                      updateSession(session.id, "startDateTime", e.target.value)
                    }
                  />
                </div>

                <div className="ce-col">
                  <div className="ce-session-element">
                    <label htmlFor={`endDate-${session.id}`}>
                      End Date and Time
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    id={`endDate-${session.id}`}
                    defaultValue={session.endDateTime}
                    min={session.startDateTime || undefined}
                    className='endDate'
                    onChange={(e) =>
                      updateSession(session.id, "endDateTime", e.target.value)
                    }
                  />
                </div>
              </div>

              <br />


              <div className="ce-row">
                <div className="ce-col">
                  <div className="ce-session-element">
                    <label htmlFor={`regStartDate-${session.id}`} >
                      Registration Start Date Time
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    name="regStartdateTime"
                    id={`regStartDate-${session.id}`}
                    defaultValue={session.regStartDateTime}
                    className='startDate'
                    onChange={(e) =>
                      updateSession(session.id, "regStartDateTime", e.target.value)
                    }
                  />
                </div>

                <div className="ce-col">
                  <div className="ce-session-element">
                    <label htmlFor={`regEndDate-${session.id}`}>
                      Registration End Date Time
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    name="regEndDateTime"
                    id={`regEndDate-${session.id}`}
                    defaultValue={session.regEndDateTime}
                    min={session.regStartDateTime || undefined}
                    className='endDate'
                    onChange={(e) =>
                      updateSession(session.id, "regEndDateTime", e.target.value)
                    }
                  />
                </div>
              </div>



<br/>


              <div className="ce-session-element">
                <label htmlFor={`subVenue-${session.id}`}>Select Venue</label>
              </div>
              <select
                name="venueId"
                className='subVenue'
                defaultValue={session.venueId}
                onChange={(e) => getSubvenue(session.id, e)}
                required
              >
                <option value="" disabled>
                  Select Venue
                </option>
                {loadingVenue || venues.length === 0 ? <option>loading venues</option>
                :
                  <>
                    {
                      venues.map((v)=>{
                        return <option key={v.id} value={v.id}>{v.venueName}</option>
                      })
                    }
                  </>
                }
              </select>




             <select
                name="subVenueId"
                className='subVenue'
                defaultValue={session.subVenueId}
                onChange={(e) =>
                  updateSession(session.id, "subVenueId", e.target.value)
                }
                required
              >
                <option value="" disabled>
                  Select Sub Venue
                </option>
                {loadingSubVenues || subVenues.length === 0 ? <option>loading sub venues</option>
                :
                  <>
                    {
                      subVenues.map((v)=>{
                        return <option key={v.id} value={v.id}>{v.subVenueName}</option>
                      })
                    }
                  </>
                }
              </select>






            </div>
          ))}


          <button>Add sessions and move next</button>
        </form>
            </div>
        </>
    )
}