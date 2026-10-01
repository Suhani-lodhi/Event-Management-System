import { Navigate, NavLink, useNavigate } from "react-router-dom";

export default function Sidebar(){
    const navigate = useNavigate();
    return (
        <>
        <div className="sidebar">
            <ul>
                <button onClick={()=> navigate("/dashboard/createEvent")}>Create new Event</button>
                <NavLink to="/dashboard" end>Dashboard</NavLink>
                <NavLink to="hhytj">Events</NavLink>
                <NavLink to="ythuyj">Attendees and Registration</NavLink>
                <NavLink to="ythjyhu">Analytics</NavLink>
                <NavLink to="hythy">Settings</NavLink>

            </ul>
        </div>
        </>
    )
}