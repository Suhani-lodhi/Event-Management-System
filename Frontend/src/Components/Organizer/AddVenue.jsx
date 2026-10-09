import { text } from "@fortawesome/fontawesome-svg-core";
import { useRef, useState } from "react"
import { createVenue } from "../../api/event";
import '../Organizer/styles/Step1EventForm.css'
import { toast } from "react-toastify";
import ConfirmCreateDialog from "./models/ConfirmCreateDialog";
import CreateVenue from "./models/CreateVenue";
import { useNavigate } from "react-router-dom";

const emptySubVenue = () => ({
  subVenueName: "",
  categoryCount: "",
  capacity: "",
  // category:{}
});

export default function AddVenue({setAddVenue}) {
  const [openDialog, setOpenDialog] = useState(false);
  const formRef = useRef(null);
  const [subVenues, setSubVenues] = useState([emptySubVenue()]);
  const navigate = useNavigate();

  const [venue, setVenue] = useState({
    venueName: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubVenueCount = (e) => {
    const count = Math.max(1, Number(e.target.value) || 1);
    setSubVenues((prev) => {
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, emptySubVenue),
        ];
      }
      return prev.slice(0, count);
    });
  };

  //   const handleCatergoryCount =(e)=>{
  //     const count = Math.max(1, Number(e.target.value) || 1);

  //   }

  const handleSubVenueChange = (index, e) => {
    const { name, value } = e.target;
    setSubVenues((prev) => prev.map((sv, i) => (i === index) ? { ...sv, [name]: value } : sv))
  }


  function handleDialogOpen() {
    console.log("open dialog")
    const form = formRef.current;
    if (!form.reportValidity()) {
      return;
    }
    setOpenDialog(true)
  }
  function handleCreateConfirm() {
    setOpenDialog(false)
    handleSubmit();
  }

  async function handleSubmit() {
    console.log(venue);
    const Venuepayload = {
      ...venue,
      //    subVenueCount: subVenues.length,
      subVenues: subVenues
    }

    console.log(Venuepayload)

    const res = await createVenue(Venuepayload);
    console.log(res.venue);

    if (res.success) {
      toast.success("created the venue");
      setAddVenue(false);
    }
    else {
      toast.error("Cannot create Venue. Something went wrong.")
    }

  }

  return (
    <>

      {/* <div className="v-header">
        <h1>My Venues</h1>
        <p>Add your venues and their sub-venues here to use them when creating events.</p>
      </div> */}
      {/* <button onClick={addVenue}>Add Your Venue</button> */}
      <div className="ce-form-page">
        <div className="ce-form-header v-form-header">
          <h2>Add Venue</h2>
        </div>
        <form ref={formRef}>
          <div className="ce-card">
            <div className="ce-field-plain">
              <label htmlFor="venueName">Venue Name</label>
              <input
                id="venueName"
                name="venueName"
                defaultValue={venue.venueName}
                onChange={handleVenueChange}
                placeholder="Add venue Name"
                required
              />
            </div>

            <br />

            <div>
              <div className="ce-card-header">
                <label htmlFor="addressLine1">Address Line 1</label>
              </div>

              <textarea
                id="addressLine1"
                name="addressLine1"
                defaultValue={venue.addressLine1}
                onChange={handleVenueChange}
                placeholder="Address Line 1"
                required
              />
            </div>

            <br />

            <div className="v-elements">
              <div className="ce-field-plain">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  defaultValue={venue.city}
                  onChange={handleVenueChange}
                  placeholder="City"
                  required
                />
              </div>

              <div className="ce-field-plain">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  name="state"
                  defaultValue={venue.state}
                  onChange={handleVenueChange}
                  placeholder="state"
                  required
                />
              </div>
            </div>

            <br />

            <div className="v-elements">
              <div className="ce-field-plain">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  defaultValue={venue.country}
                  onChange={handleVenueChange}
                  placeholder="Country"
                  required
                />
              </div>

              <div className="ce-field-plain">
                <label htmlFor="pincode">Pincode</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="number"
                  defaultValue={venue.pincode}
                  onChange={handleVenueChange}
                  placeholder="Pincode"
                  required
                />
              </div>
            </div>

            <br />
            <div className="ce-field-plain">
              <label htmlFor="subVenueCount">Number of Sub-Venues</label>
              <input
                id="subVenueCount"
                type="number"
                min="1"
                value={subVenues.length}
                placeholder="Sub Venues Count"
                onChange={handleSubVenueCount}
              />
            </div>
          </div>
          <br />


          <div className="ce-form-header v-form-header">
            <h2>Add SubVenue Details</h2>
            {/* <button onClick={handleSubVenueCount} type="button">Add subVenue</button> */}
          </div>
          {subVenues.map((sv, index) => (
            <div key={`subvenue-${index}`}>
              <h3>Session {index + 1}</h3>

              <div className="sv-elements ce-card" >
                <div className="ce-field-plain">
                  <label htmlFor={`subVenueName-${index}`}>Sub-Venue Name</label>
                  <input
                    id={`subVenueName-${index}`}
                    name="subVenueName"
                    defaultValue={sv.subVenueName}
                    placeholder="Sub Venue Name"
                    onChange={(e) => handleSubVenueChange(index, e)}
                  />
                </div>

                <div className="ce-field-plain">
                  <label htmlFor={`categoryCount-${index}`}>Category Count</label>
                  <input
                    id={`categoryCount-${index}`}
                    name="categoryCount"
                    type="number"
                    min="0"
                    defaultValue={sv.categoryCount}
                    placeholder="Category count"
                    onChange={(e) => handleSubVenueChange(index, e)}
                    required
                  />
                </div>

                <div className="ce-field-plain">
                  <label htmlFor={`capacity-${index}`}>Capacity</label>
                  <input
                    id={`capacity-${index}`}
                    name="capacity"
                    type="number"
                    min="0"
                    defaultValue={sv.capacity}
                    placeholder="Capacity"
                    onChange={(e) => handleSubVenueChange(index, e)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={handleDialogOpen} type="button">Create Venue</button>

        </form>
      </div>

      <CreateVenue
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleCreateConfirm}
        createVenue={true}
        isEdit={false}
      />
    </>
  )
}