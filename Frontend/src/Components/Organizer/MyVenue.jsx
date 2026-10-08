import { text } from "@fortawesome/fontawesome-svg-core";
import { useState } from "react"
import { createVenue } from "../../api/event";
import '../Organizer/styles/CreateEvents.css'
import { toast } from "react-toastify";

const emptySubVenue = () => ({
  subVenueName: "",
  categoryCount: "",
  capacity: "",
 // category:{}
});

export default function MyVenue(){
    const [openDialog, setOpenDialog] = useState(true);
    const [closeDialog, setCloseDialog] = useState(true);
     const [subVenues, setSubVenues] = useState([emptySubVenue()]);
    
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

  const handleSubVenueChange=  (index, e)=>{
    const {name, value}=e.target;
    setSubVenues((prev)=> prev.map((sv, i)=> (i===index) ? {...sv, [name]: value} : sv))
  }

    async function handleSubmit(e){
       e.preventDefault;
       console.log(venue);
       const Venuepayload ={
           ...venue,
        //    subVenueCount: subVenues.length,
           subVenues: subVenues
       }

       console.log(Venuepayload)

       const res = await createVenue(Venuepayload);
       console.log(res.venue);

       if(res.success){
        toast.success("created the venue");
        e.reset;
       }


    }

    return (
        <>
          <h1>My Venues</h1>
          <p>Add you own Venues</p>
          {/* <button onClick={addVenue}>Add Your Venue</button> */}

          <form action={handleSubmit}>
            <div>
        {/* <label htmlFor="venueName">Venue Name</label> */}
        <input
          id="venueName"
          name="venueName"
          defaultValue={venue.venueName}
          onChange={handleVenueChange}
          placeholder="Add venue Name"
          required
        />
      </div>

      <div>
        {/* <label htmlFor="addressLine1">Address Line 1</label> */}
        <input
          id="addressLine1"
          name="addressLine1"
          defaultValue={venue.addressLine1}
          onChange={handleVenueChange}
          placeholder="Address Line 1"
          required
        />
      </div>

      <div>
        {/* <label htmlFor="city">City</label> */}
        <input
          id="city"
          name="city"
          defaultValue={venue.city}
          onChange={handleVenueChange}
          placeholder="City"
          required
        />
      </div>

      <div>
        {/* <label htmlFor="state">State</label> */}
        <input
          id="state"
          name="state"
          defaultValue={venue.state}
          onChange={handleVenueChange}
          placeholder="state"
          required
        />
      </div>

      <div>
        {/* <label htmlFor="country">Country</label> */}
        <input
          id="country"
          name="country"
          defaultValue={venue.country}
          onChange={handleVenueChange}
          placeholder="Country"
          required
        />
      </div>

      <div>
        {/* <label htmlFor="pincode">Pincode</label> */}
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

    <div>
        {/* <label htmlFor="subVenueCount">Number of Sub-Venues</label> */}
        <input
          id="subVenueCount"
          type="number"
          min="1"
          value={subVenues.length}
          placeholder="Sub Venues Count"
          onChange={handleSubVenueCount}
        />
      </div>

      {subVenues.map((sv, index) => (
        <fieldset key={index}>
          <legend>Sub-Venue {index + 1}</legend>

          <div>
            <div>
            {/* <label htmlFor={`subVenueName-${index}`}>Sub-Venue Name</label> */}
            <input
              id={`subVenueName-${index}`}
              name="subVenueName"
              defaultValue={sv.subVenueName}
              placeholder="Sub Venue Name"
              onChange={(e) => handleSubVenueChange(index, e)}
            />
          </div>

          <div>
            {/* <label htmlFor={`categoryCount-${index}`}>Category Count</label> */}
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

          <div>
            {/* <label htmlFor={`capacity-${index}`}>Capacity</label> */}
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
        </fieldset>
      ))}

      <button type="submit">Create Venue</button>

          </form>
        </>
    )
}