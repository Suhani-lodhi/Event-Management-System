import { useState } from "react"
import MainContent from "../../Components/MainContent"
import Navbar from "../../Components/Navbar"
import UserNavigation from "../../Components/User/UserNavigation"
export default function UserDashboard(){
  const [category, setCategory] = useState(null)
    return (
        <>
        <Navbar/>
          <UserNavigation setCategory={setCategory}/>
          <div className="user-main">
            <MainContent category={category}/>
          </div>
        </>
    )
}