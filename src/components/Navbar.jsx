import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-left">
          <Link to="/" className="brand-logo">
            <span className="logo-glow"></span>
            CINEVERSE
          </Link>

          <div className="city-selector">
            <span className="city-icon">📍</span>
            <select
              value={localStorage.getItem("cineverse_city") || "Delhi"}
              onChange={(e) => {
                localStorage.setItem("cineverse_city", e.target.value);
                window.location.reload();
              }}
              className="city-select-dropdown"
            >
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Mohali">Mohali</option>
            </select>
          </div>
        </div>

        {user ? (
          <>
            <nav className="nav-links">
              {user.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className={`nav-link ${location.pathname === "/admin" ? "active" : ""}`}
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/movies"
                className={`nav-link ${location.pathname === "/movies" ? "active" : ""}`}
              >
                Browse Movies
              </Link>
              <Link
                to="/booking"
                className={`nav-link ${location.pathname === "/booking" ? "active" : ""}`}
              >
                Book Seats
              </Link>
            </nav>

            <div className="user-profile">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Log Out
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
      <style>{`
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .city-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .city-icon {
          font-size: 0.95rem;
        }

        .city-select-dropdown {
          background: transparent;
          border: none;
          color: var(--text-white);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .city-select-dropdown option {
          background: #0f0a1c;
          color: #fff;
        }

        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(7, 5, 18, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
          width: 100%;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .brand-logo {
          font-family: var(--font-title);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-white);
          text-decoration: none;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          position: relative;
          background: linear-gradient(135deg, var(--secondary), var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-glow {
          position: absolute;
          width: 24px;
          height: 24px;
          background: var(--primary);
          filter: blur(10px);
          opacity: 0.4;
          z-index: -1;
          left: -4px;
        }

        .nav-links {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-family: var(--font-title);
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          position: relative;
          padding: 6px 0;
        }

        .nav-link:hover {
          color: var(--text-white);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, var(--secondary), var(--primary));
          transition: width 0.3s ease;
        }

        .nav-link.active {
          color: var(--text-white);
        }

        .nav-link.active::after {
          width: 100%;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-email {
          font-size: 0.9rem;
          color: var(--text-muted);
          border-right: 1px solid var(--border-color);
          padding-right: 16px;
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 0.8rem;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 16px;
          }
          .user-email {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

export default Navbar;
