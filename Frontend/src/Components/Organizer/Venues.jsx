import { useState } from 'react'
import '../Organizer/styles/CreateEvents.css'
import AddVenue from './AddVenue'
import MyVenue from './MyVenue'
import ViewVenue from './ViewVenue'
export default function Venues(){
    const [addVenue, setAddVenue] = useState(false)
    const [viewVenue, setViewVenue] = useState(false)
    return (
        <>
          <div className="v-header">
        <div>
            <h1>My Venues</h1>
        <p>Add your venues and their sub-venues here to use them when creating events.</p>
        </div>
        <button onClick={()=> setAddVenue(true)} className='av-button'>Add new Venue</button>
      </div>
      
      {addVenue && !viewVenue && <AddVenue setAddVenue={setAddVenue}/>}
      
     {!addVenue && !viewVenue &&  <MyVenue setViewVenue={setViewVenue}/>}
      
      {!addVenue && viewVenue && <viewVenue/> }
      
      
        </>
    )
}