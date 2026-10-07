import { Outlet } from "react-router-dom";

export default function MainContent(){
    return (
        <>
          <div className="main-content">
            <Outlet />
          </div>
        </>
    )
}