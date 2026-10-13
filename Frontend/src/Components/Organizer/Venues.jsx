import { useState } from 'react'
import '../Organizer/styles/CreateEvents.css'
import AddVenue from './AddVenue'
import MyVenue from './MyVenue'
import ViewVenue from './ViewVenue'
import { useParams, useLocation} from 'react-router-dom'
export default function Venues(){
    const {id} = useParams();
    const location = useLocation();
    const [addVenue, setAddVenue] = useState(location.state?.openAddVenue ?? false)


    return (
        <>
          <div className="v-header">
        <div>
        <h1>My Venues</h1>
        <p>Add your venues and their sub-venues here to use them when creating events.</p>
        </div>
        {!id && <button onClick={()=> setAddVenue(true)} className='av-button'>Add new Venue</button>}
      </div>

     {id ? <AddVenue setAddVenue={setAddVenue}/>
       : 
       <>
       {addVenue && <AddVenue setAddVenue={setAddVenue}/>}
      
     {!addVenue &&  <MyVenue />}
       </>
    }
      
      
      
  
      
      
        </>
    )
}