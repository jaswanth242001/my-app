import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Logo size={30} />
        <span>NoteFlow</span>
      </div>
      <nav className="navbar-links">
        <NavLink to="/notes" className={({ isActive }) => (isActive ? "active" : "")}>
          Notes
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          Profile
        </NavLink>
      </nav>
      <button className="navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}

export default NavBar;
