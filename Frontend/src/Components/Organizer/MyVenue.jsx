import { useEffect, useState } from 'react'
import '../Organizer/styles/OrganizerDashboard.css'
import { getVenuesOfOrganizer } from '../../api/event';

export default function MyVenue(){
    const [venues, setVenues] = useState([]);
    useEffect(()=>{
        async function getVenues(){
            const data = await getVenuesOfOrganizer();
            console.log(data.venues)
            setVenues(data.venues);
        }

        getVenues()
    },[])
    return (
        <>
          
          <div>
              {venues && venues.map((v)=>{
                <div className="od-event-card" key={v.id}  >
                <div className="od-event-main">
            
                  

                </div>

              </div>
              })}
          </div>
        </>
    )
}