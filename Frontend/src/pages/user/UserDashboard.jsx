import MainContent from "../../Components/MainContent"
import Navbar from "../../Components/Navbar"
import UserNavigation from "../../Components/User/UserNavigation"
export default function UserDashboard(){
    return (
        <>
        <Navbar/>
          <UserNavigation />
          <MainContent />
        </>
    )
}