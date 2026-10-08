import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";


export default function AddVenue({open, onClose}){
    return (
        <>
          <Dialog open={open} onClose={onClose}>
              <DialogTitle>Add Your Venue</DialogTitle>
              <DialogContent>
                <DialogContentText>
                   
                </DialogContentText>
              </DialogContent>
          </Dialog>
        </>
    )
}