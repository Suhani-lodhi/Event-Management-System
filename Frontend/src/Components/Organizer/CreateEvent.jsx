import { useEffect, useState } from "react"
import Step1EventForm from "./Step1EventForm";
import '../Organizer/styles/CreateEvents.css'
import Step2Session from "./Step2Sessions";
import { useParams } from "react-router-dom";

export default function CreateEvents({addSession, createEvent}) {

    const {id} = useParams();
    const isEditMode = Boolean(id);
    const [step, setStep] = useState(addSession && !createEvent ? 2 : 1);
    const [eventId, setEventId] = useState(null)
    

    useEffect(()=>{
      if(createEvent){
        console.log("create event called");
      }
    }, [createEvent])
   


    return (
        <>
            <div className="ce-header">

  <div className="ce-steps">
    <span className={step === 1 ? "active" : ""} onClick={() => setStep(1)}>
      <h4>Step 1</h4>
      <p>Basic Information</p>
    </span>
    <span className={step === 2 ? "active" : ""} onClick={() => eventId && setStep(2)}>
      <h4>Step 2</h4>
      <p>Sessions and Venue</p>
    </span>
    <span className={step === 3 ? "active" : ""} onClick={() => eventId && setStep(3)}>
      <h4>Step 3</h4>
      <p>Settings and Form</p>
    </span>
  </div>
</div>


      <div hidden={step !== 1}>
          <Step1EventForm setStep={setStep}
           id = {id ? id : null}
           createEvent={createEvent}
           setEventId={setEventId}
          />
      </div>


      <div hidden={step !== 2}>
         <Step2Session setStep={setStep} 
          eventId={eventId}
          id = {id? id : null}
          createEvent={createEvent}
         />
      </div>


      <div hidden={step !== 3}>
        
      </div>

     

                

        </>
    )
}