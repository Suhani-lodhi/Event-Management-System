import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCircleQuestion, faSearch } from "@fortawesome/free-solid-svg-icons";



export default function Navbar() {
  const user = { name: "Ishpreet Singh", role: "Organizer", avatar: "" };
  const initials = user.name.split(" ").map((n) => n[0]).join("");

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

          <li>
            <a href="" className="user">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <div className="avatar">{initials}</div>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}