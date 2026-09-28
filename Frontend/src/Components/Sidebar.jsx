import { NavLink } from "react-router-dom";

export default function Sidebar(){
    return (
        <>
        <div className="sidebar">
            <ul>
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