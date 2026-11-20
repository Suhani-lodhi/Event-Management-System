import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import PolicyIcon from '@mui/icons-material/Policy';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function EventSettingDialog({entry, eventRules}) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      {/* <Button variant="outlined" onClick={handleClickOpen}>
        Rules and Restrictions
      </Button> */}
     <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap:"5px",
        alignItems: "center",
        cursor: "pointer",
     }}
     
     onClick={handleClickOpen}>
         <PolicyIcon/>
         <span><i><u>Instructions</u></i></span>
     </div>
      <Dialog
        open={open}
        slots={{
          transition: Transition,
        }}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        role="alertdialog"
      >
        <DialogTitle>{"Event Rules and Restrictions"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
              <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'auto',
        maxHeight: 300,
        listStyleType: 'disc',
 pl: 2,
 '& .MuiListItem-root': {
  display: 'list-item',
 },
        '& ul': { padding: 0 },
      }}
    //   subheader={<li />}
    >

      <ListItem>
      <ListItemText primary={`Minimum age for the event is ${entry.minimumAge} years.`}/>
    </ListItem>
    <ListItem>
      <ListItemText primary={`Ticket not required below age of ${entry.ticketRequiredAboveAge} years.`}/>
    </ListItem>

     <ListItem >
      
                <ListItemText primary= {eventRules.photographyRecordingAllowed ? "Photography and recording is allowed": "Photography and recording is not allowed"} />
    </ListItem>

    <ListItem>
               <ListItemText primary={eventRules.petsAllowed ? "Event is pet friendly": "Pets are not allowed"} />
    </ListItem>

   <ListItem>
                <ListItemText primary={eventRules.outsideFoodAllowed ? "You can enjoy the event with your own food": "Food from outside is not allowed"} />
   </ListItem>
    
    <ListItem>
                <ListItemText primary={eventRules.smokingAllowed ? "": "Smoking is not allowed"} />
    </ListItem>


       
    
    </List>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            close
          </Button>
         
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
