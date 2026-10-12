import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContentText from '@mui/material/DialogContentText'
export default function CreateVenue({open, onClose, onConfirm}){
    return (
        <>
          <Dialog open={open} onClose={onClose}>
              <DialogTitle>Confirm Creation</DialogTitle>
              <DialogContent>
                 <DialogContentText>
                    Are you sure you want to create this venue 
                  </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm}>create</Button>
              </DialogActions>
          </Dialog>
        </>
    )
}