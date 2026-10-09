import { useState } from 'react'
import '../Organizer/styles/CreateEvents.css'
import AddVenue from './AddVenue'
import MyVenue from './MyVenue'
export default function Venues(){
    const [addVenue, setAddVenue] = useState(false)
    return (
        <>
          <div className="v-header">
        <div>
            <h1>My Venues</h1>
        <p>Add your venues and their sub-venues here to use them when creating events.</p>
        </div>
        <button onClick={()=> setAddVenue(true)} className='av-button'>Add new Venue</button>
      </div>
      
      {addVenue && <AddVenue setAddVenue={setAddVenue}/>}
      
     {!addVenue &&  <MyVenue/>}
      
      
      
        </>
    )
}