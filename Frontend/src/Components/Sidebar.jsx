import { Navigate, NavLink, useNavigate } from "react-router-dom";

export default function Sidebar(){
    const navigate = useNavigate();
    return (
        <>
        <div className="sidebar">
            <ul>
                <button onClick={()=> navigate("/dashboard/createEvent")}>Create new Event</button>
                <NavLink to="/dashboard" end>Dashboard</NavLink>
                <NavLink to="/dashboard/myVenues">My Venues</NavLink>
                <NavLink to="/dashboard/bookingStats">Analytics</NavLink>
                <NavLink to="/dashboard/checkStatus">Booking Status</NavLink>
                <NavLink to="hythy">Settings</NavLink>
                <NavLink to="/dashboard/me">My Profile</NavLink>
            </ul>
        </div>
        </>
    )
}