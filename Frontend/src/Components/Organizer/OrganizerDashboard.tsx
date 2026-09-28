import { NavLink } from "react-router-dom";

export default function OrganizerDashboard(){
    return (
        <>
        <h1>Dashboard</h1>
        <NavLink to="/dashboard/createEvent">Create new event</NavLink>
        </>
    )
}