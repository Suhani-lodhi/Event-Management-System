import { useState } from "react"
import Step1EventForm from "./Step1EventForm";
import '../Organizer/styles/CreateEvents.css'
import Step2Session from "./Step2Sessions";

export default function CreateEvents() {

    const [step, setStep] = useState(1);
    // const [startDate, setStartDate] = useState("");
    // const [endDate, setEndDate] = useState("");
    // const [regStartDate, setRegStartDate] = useState("");
    // const [regEndDate, setRegEndDate] = useState("");

    console.log(step);




    return (
        <>
            <div className="ce-header">
  {/* <h1>Create New Event</h1> */}

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
      <p>Settings and Form</p>
    </span>
  </div>
</div>


      <div hidden={step !== 1}>
          <Step1EventForm setStep={setStep}/>
      </div>


      <div hidden={step !== 2}>
         <Step2Session setStep={setStep} />
      </div>


      <div hidden={step !== 3}>
        
      </div>

     

                

        </>
    )
}