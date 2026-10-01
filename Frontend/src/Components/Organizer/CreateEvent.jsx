import { useState } from "react"
import Step1EventForm from "./Step1EventForm";
import '../Organizer/styles/CreateEvents.css'
import Step2Session from "./Step2Sessions";
import { useParams } from "react-router-dom";

export default function CreateEvents() {

    const {id} = useParams();
    const isEditMode = Boolean(id);
    const [step, setStep] = useState(1);

    

    console.log(step);

   


    return (
        <>
            <div className="ce-header">

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
          <Step1EventForm setStep={setStep}
          isEditMode
          id
          />
      </div>


      <div hidden={step !== 2}>
         <Step2Session setStep={setStep} />
      </div>


      <div hidden={step !== 3}>
        
      </div>

     

                

        </>
    )
}