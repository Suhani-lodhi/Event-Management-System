import Navbar from "../../Components/Navbar"
import UserNavigation from "../../Components/user/UserNavigation"
export default function UserDashboard(){
    return (
        <>
        <Navbar role="user"/>
          <UserNavigation />
        </>
    )
}