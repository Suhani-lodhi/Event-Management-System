import Button from '@mui/material/Button'
import {Dialog} from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
export default function ConfirmCreateDialog(){
    return (
        <>
          <Dialog>
              <DialogTitle>Confirm Creation</DialogTitle>
              <DialogContent>
                Are you sure you want to create this?
              </DialogContent>
              <DialogActions>
                <Button>Cancel</Button>
                <Button>Confirm</Button>
              </DialogActions>
          </Dialog>
        </>
    )
}