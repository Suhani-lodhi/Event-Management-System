import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContentText from '@mui/material/DialogContentText'
export default function ConfirmCreateDialog({open, onClose, onConfirm, eventTitle, isEdit}){
    return (
        <>
          <Dialog open={open} onClose={onClose}>
              <DialogTitle>Confirm {isEdit ? "Edit" : "Creation"}</DialogTitle>
              <DialogContent>
                 <DialogContentText>
                    {isEdit ? "Are you sure you want to edit event" : "The event created will be drafted until you publish. You can publish the event by completing all the necessary information. Are you sure you want to create the event? "}
                  </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm}>{isEdit ? "edit" : "create"} Event</Button>
              </DialogActions>
          </Dialog>
        </>
    )
}