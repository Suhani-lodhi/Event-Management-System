import MainContent from "../../Components/MainContent";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";

export default function Dashboard(){
    return (
        <>
           <Navbar />
           <div className="dashboard">
           <Sidebar />
           <MainContent />
           </div>
        </>
    )
}