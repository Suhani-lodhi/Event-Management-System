import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContentText from '@mui/material/DialogContentText'
export default function DeleteDialog({open, onClose, onConfirm}){
    return (
        <>
          <Dialog open={open} onClose={onClose}>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                 <DialogContentText>
                    Are you sure you want to delete ?
                  </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm}>Delete</Button>
              </DialogActions>
          </Dialog>
        </>
    )
}