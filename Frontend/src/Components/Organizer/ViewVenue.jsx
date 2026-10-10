import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";

export default function ViewVenue(){
    const {id} = useParams();
    const [venue, setVenue] = useState(null);

    useEffect(()=>{
        async function getVenueDetails(){
            
        }
    })
    
    return (
        <>
          <h1>Venue details</h1>
        </>
    )
}