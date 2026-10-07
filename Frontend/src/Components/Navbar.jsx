import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCircleQuestion, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ FIXED 1: Added missing import
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // ✅ FIXED 2: Initialized navigate hook

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  function handleLogout(){
    handleClose();
    logout();
    navigate("/login");
  }

  const getInitials = () => {
    // console.log(user.firstName)
    if (!user?.firstName) return "?";
    return user.firstName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <nav className="navbar">
        <h1>Occasia</h1>
        <form className="search" role="search">
          <span className="search-icon">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search events, attendees, venues..."
            aria-label="Search"
          />
        </form>

        <ul className="nav-right">
          <li>
            <a href="" className="nav-link" aria-label="Notifications">
              <FontAwesomeIcon icon={faBell} />
            </a>
          </li>

          <li>
            <a href="" className="nav-link help">
              <FontAwesomeIcon icon={faCircleQuestion} />
              <span>Help &amp; Docs</span>
            </a>
          </li>

          <li className="user">
            <div className="user-info">
              <div className="user-name">{user?.firstName || "Loading..."}</div>
              <div className="user-role">{user?.role || ""}</div>
            </div>

            <div>
              <div
                id="demo-positioned-button"
                className="avatar"
                aria-controls={open ? 'demo-positioned-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={handleClick}
              >
                {/* ✅ FIXED 4: Using the safe initials handler */}
                {getInitials()} 
              </div>
              <Menu
                id="demo-positioned-menu"
                aria-labelledby="demo-positioned-button"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 180,
                      borderRadius: "10px",
                      border: "1px solid var(--color-blush-mid)",
                      boxShadow: "0 8px 24px rgba(152, 62, 221, 0.15)",
                    },
                  },
                }}
              >
                <MenuItem onClick={handleLogout}
                  sx={{
                    fontSize: "14px",
                    py: 1.2,
                    px: 2,
                    "&:hover": {
                      backgroundColor: "var(--color-blush-lightest)",
                    },
                  }}
                >Logout</MenuItem>
              </Menu>
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
}
