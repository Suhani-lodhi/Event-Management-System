import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { getVenueDetails, deleteSubVenue, editSubVenueById} from "../../api/event";
import '../Organizer/styles/MyVenues.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import EditSubVenueDialog from "./models/EditSubVenue";
import DeleteDialog from "./models/DeleteDialog";


export default function ViewVenue(){
    const {id} = useParams();
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [editingSubVenue, setEditingSubVenue] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(()=>{
        async function getVenue(){
            try {
        const data = await getVenueDetails(id);
        setVenue(data.venue);
      } catch (err) {
        console.error(err);
        setVenue(null);
      } finally {
        setLoading(false);
      }
        }

        getVenue();
    },[id])


    function handleDeleteSubVenue(id){
         setDeleteDialog(true);
         setDeleteId(id);
    }

    function confirmDelete(){
       DeleteSubVenue(deleteId);
       setDeleteDialog(false);
    }

    async function DeleteSubVenue(id){
        const res = await deleteSubVenue(id);
        if(res.success){
            toast.success("SubVenue deleted successfully");
            setVenue((prev) => ({
  ...prev,
  subVenues: prev.subVenues.filter((sv) => sv.id !== id),
}));
        }
        else{
            toast.error("Something went wrong. Can't delete Sub Venue")
        }
    }

    function editVenue(id){
        console.log("edit venue");
        navigate('/dashboard/editVenue/'+id)
    }


    function handleEditSubVenue(subVenue){
        setEditingSubVenue(subVenue);
    }

    async function handleSaveSubVenue(subVenueId, data) {
  try {
    const res = await editSubVenueById(subVenueId, data);

    if (res.success) {
      toast.success("SubVenue edited successfully");

      setVenue((prev) => ({
        ...prev,
        subVenues: prev.subVenues.map((sv) =>
          sv.id === subVenueId ? res.subVenue : sv
        ),
      }));

      setEditingSubVenue(null); // close the dialog
    } else {
      toast.error("Something went wrong. Can't edit sub venue");
    }
  } catch (err) {
    console.log(err);
    toast.error("Something went wrong. Can't edit sub venue");
  }
}


     if (loading) return <p>Loading venue...</p>;
  if (!venue) return <p>Venue not found.</p>;
    
    return (
        <>
           <div className="vd-page">

      <h1>Venue Details</h1>

      {/* Venue card */}
      <div className="vd-card">
        <div className="vd-elements">
            <h2 className="vd-title">{venue.venueName}</h2>
        <button onClick={() => editVenue(venue.id)}>Edit Venue</button>
        </div>

        <div className="vd-info">
          <p>
            <strong>Address:</strong> {venue.addressLine1}
          </p>
          <p>
            <strong>City:</strong> {venue.city}
          </p>
          <p>
            <strong>State:</strong> {venue.state}
          </p>
          
          <p>
            <strong>Country:</strong> {venue.country}
          </p>
          <p>
            <strong>Pincode:</strong> {venue.pincode}
          </p>
          <p>
            <strong>Sub-venues:</strong> {venue.subVenueCount}
          </p>
        </div>
      </div>

      {/* Sub-venue cards */}
      <h2 className="vd-section-title">Sub-Venues</h2>

      {venue.subVenues?.length > 0 ? (
        <div className="vd-grid">
          {venue.subVenues.map((sv) => (
            <div className="vd-subcard" key={sv.id}>
              <div className="vd-elements">
                <h3>{sv.subVenueName || "Unnamed sub-venue"}</h3>
                <div>
                 <FontAwesomeIcon icon={faEdit} onClick={() => handleEditSubVenue(sv)}/>
                {venue.subVenues.length > 1 && <FontAwesomeIcon icon={faTrash} onClick={() => handleDeleteSubVenue(sv.id)} />}
                </div>
              </div>
              <p>
                <strong>Categories:</strong> {sv.categoryCount}
              </p>
              <p>
                <strong>Capacity:</strong> {sv.capacity ?? "-"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No sub-venues added.</p>
      )}
    </div>

    <EditSubVenueDialog
    open={Boolean(editingSubVenue)}
  subVenue={editingSubVenue}
  onClose={() => setEditingSubVenue(null)}
  onSave={handleSaveSubVenue}
    />
    <DeleteDialog
          open={deleteDialog}
          onClose ={() => {
            setDeleteId(null)
            setDeleteDialog(false)}
          }
          onConfirm = {confirmDelete}
          />
        </>
    )
}