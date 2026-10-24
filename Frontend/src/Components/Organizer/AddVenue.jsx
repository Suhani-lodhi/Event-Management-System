import { text } from "@fortawesome/fontawesome-svg-core";
import { useEffect, useRef, useState } from "react"
import { createVenue, editVenueById, getVenueDetails } from "../../api/event";
import '../Organizer/styles/Step1EventForm.css'
import { toast } from "react-toastify";
import ConfirmCreateDialog from "./models/ConfirmCreateDialog";
import CreateVenue from "./models/CreateVenue";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmCreationDialog from './models/ConfirmCreateDialog'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  emptyCategory,
  validateCategory,
  toCategoryPayload,
  sumSeats,
  hasDuplicateNames,
} from "../../utils/seatCategoryHelpers.jsx";

// categoryCount and capacity are no longer typed in: they come from `categories`
const emptySubVenue = () => ({
  subVenueName: "",
  categories: [],
});

export default function AddVenue({setAddVenue}) {
  const {id} = useParams();
  const [openDialog, setOpenDialog] = useState(false);
  const formRef = useRef(null);
  const [subVenues, setSubVenues] = useState([emptySubVenue()]);
  const navigate = useNavigate();
  const [editDialog, setEditDialog] = useState(false);


  const [venue, setVenue] = useState({
    venueName: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  useEffect(()=>{
    // only load when editing an existing venue
    if (!id) return;
    async function getVenue(){
      const data = await getVenueDetails(id);
      console.log(data.venue);
      setVenue(data.venue);
    }
    getVenue();
  },[id])

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

  const handleSubVenueChange = (index, e) => {
    const { name, value } = e.target;
    setSubVenues((prev) => prev.map((sv, i) => (i === index) ? { ...sv, [name]: value } : sv))
  }

  // ---- seat categories (per sub-venue) ----

  const addCategory = (svIndex) => {
    setSubVenues((prev) =>
      prev.map((sv, i) =>
        i === svIndex ? { ...sv, categories: [...sv.categories, emptyCategory()] } : sv
      )
    );
  };

  const removeCategory = (svIndex, catIndex) => {
    setSubVenues((prev) =>
      prev.map((sv, i) =>
        i === svIndex
          ? { ...sv, categories: sv.categories.filter((_, ci) => ci !== catIndex) }
          : sv
      )
    );
  };

  const handleCategoryChange = (svIndex, catIndex, e) => {
    const { name, value } = e.target;
    setSubVenues((prev) =>
      prev.map((sv, i) =>
        i === svIndex
          ? {
              ...sv,
              categories: sv.categories.map((c, ci) =>
                ci === catIndex ? { ...c, [name]: value } : c
              ),
            }
          : sv
      )
    );
  };

  // returns true when every category in every sub-venue is valid
  function categoriesAreValid() {
    for (let i = 0; i < subVenues.length; i++) {
      const sv = subVenues[i];
      const label = sv.subVenueName.trim() || `Sub-Venue ${i + 1}`;
      for (const c of sv.categories) {
        const error = validateCategory(c);
        if (error) {
          toast.error(`${label}: ${error}`);
          return false;
        }
      }
      if (hasDuplicateNames(sv.categories)) {
        toast.error(`${label}: category names must be unique`);
        return false;
      }
    }
    return true;
  }


  function handleDialogOpen() {
    console.log("open dialog")
    const form = formRef.current;
    if (!form.reportValidity()) {
      return;
    }
    if (!categoriesAreValid()) {
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
      subVenues: subVenues.map((sv) => ({
        subVenueName: sv.subVenueName,
        categoryCount: sv.categories.length,
        capacity: sv.categories.length ? sumSeats(sv.categories) : null,
        categories: sv.categories.map(toCategoryPayload),
      })),
    }

    console.log(Venuepayload)

    try {
      const res = await createVenue(Venuepayload);
      console.log(res.venue);

      if (res.success) {
        toast.success("created the venue");
        setAddVenue(false);
      }
      else {
        toast.error("Cannot create Venue. Something went wrong.")
      }
    } catch (err) {
      toast.error("Cannot create Venue. Something went wrong.")
    }

  }

  function handleEditVenue(){
    setEditDialog(true);
  }
  function confirmEdit(){
    setEditDialog(false);
    editVenue();
  }

  async function editVenue(){
    try{
      const data = await editVenueById(id, venue);
      if(data.success){
        toast.success("Venue Edited Successfully");
        navigate(-1)
      }
      else{
        toast.error("Something went wrong. Can't edit venue");
      }
    }
    catch(err){
        toast.error("Something went wrong. Can't edit venue");
    }
  }



  return (
    <>
      <div className="ce-form-page">
        <div className="ce-form-header v-form-header">
          <h2>{id ? "Edit" : "Add"} Venue</h2>
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
            {!id && <div className="ce-field-plain">
              <label htmlFor="subVenueCount">Number of Sub-Venues</label>
              <input
                id="subVenueCount"
                type="number"
                min="1"
                value={subVenues.length}
                placeholder="Sub Venues Count"
                onChange={handleSubVenueCount}
              />
            </div>}
          </div>
          <br />


          {!id && <><div className="ce-form-header v-form-header">
            <h2>Add SubVenue Details</h2>
          </div>
          {subVenues.map((sv, svIndex) => (
            <div key={`subvenue-${svIndex}`}>
              <h3>Sub-Venue {svIndex + 1}</h3>
              <div className="ce-card">
                <div className="ce-field-plain">
                  <label htmlFor={`subVenueName-${svIndex}`}>Sub-Venue Name</label>
                  <input
                    id={`subVenueName-${svIndex}`}
                    name="subVenueName"
                    value={sv.subVenueName}
                    placeholder="Sub Venue Name"
                    onChange={(e) => handleSubVenueChange(svIndex, e)}
                  />
                </div>

                {/* seat categories */}
                <div className="sc-add-head">
                  <h4>Seat Categories</h4>
                  <button type="button" onClick={() => addCategory(svIndex)}>
                    Add Category +
                  </button>
                </div>

                <p className="sc-summary">
                  <strong>Categories:</strong> {sv.categories.length}
                  {" | "}
                  <strong>Capacity:</strong> {sv.categories.length ? sumSeats(sv.categories) : "-"}
                </p>

                {sv.categories.length === 0 && (
                  <p className="sc-summary">No categories added.</p>
                )}

                {sv.categories.map((c, catIndex) => (
                  <div className="sc-add-row" key={`cat-${svIndex}-${catIndex}`}>
                    <div className="sc-add-head">
                      <strong>Category {catIndex + 1}</strong>
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="icon"
                        onClick={() => removeCategory(svIndex, catIndex)}
                      />
                    </div>
                    <div className="sc-add-fields">
                      <div className="ce-field-plain">
                        <label htmlFor={`catName-${svIndex}-${catIndex}`}>Category Name</label>
                        <input
                          id={`catName-${svIndex}-${catIndex}`}
                          name="categoryName"
                          value={c.categoryName}
                          placeholder="e.g. VIP"
                          onChange={(e) => handleCategoryChange(svIndex, catIndex, e)}
                          required
                        />
                      </div>

                      <div className="ce-field-plain">
                        <label htmlFor={`catSeats-${svIndex}-${catIndex}`}>Seat Count</label>
                        <input
                          id={`catSeats-${svIndex}-${catIndex}`}
                          name="seatCount"
                          type="number"
                          min="1"
                          step="1"
                          value={c.seatCount}
                          placeholder="Seat count"
                          onChange={(e) => handleCategoryChange(svIndex, catIndex, e)}
                          required
                        />
                      </div>

                      <div className="ce-field-plain">
                        <label htmlFor={`catDetail-${svIndex}-${catIndex}`}>Details (optional)</label>
                        <input
                          id={`catDetail-${svIndex}-${catIndex}`}
                          name="categoryDetail"
                          value={c.categoryDetail}
                          placeholder="Details"
                          onChange={(e) => handleCategoryChange(svIndex, catIndex, e)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <br />
            </div>
          ))}
          </>
        }

         {id ?
          <button onClick={handleEditVenue} type="button">Edit Venue</button>
        : <button onClick={handleDialogOpen} type="button">Create Venue</button>}
          <button onClick={() => id? navigate(-1) : setAddVenue(false)} type="button">Back</button>
        </form>
      </div>

      <CreateVenue
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleCreateConfirm}
      />
      
      <ConfirmCreationDialog
      open={editDialog}
      onClose= {() => setEditDialog(false)}
      onConfirm= {confirmEdit}
      isEdit={true}
      />

    </>
  )
}