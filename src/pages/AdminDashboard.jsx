import { useState, useEffect } from "react";

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("metrics"); // metrics, movies, theaters, shows, users, coupons
  const [metrics, setMetrics] = useState(null);
  
  // Data lists
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Movie Form State
  const [movieTitle, setMovieTitle] = useState("");
  const [movieGenre, setMovieGenre] = useState("");
  const [movieDuration, setMovieDuration] = useState("");
  const [movieDescription, setMovieDescription] = useState("");
  const [movieRating, setMovieRating] = useState("PG-13");
  const [movieReleaseDate, setMovieReleaseDate] = useState("");
  const [moviePoster, setMoviePoster] = useState("");
  const [movieBanner, setMovieBanner] = useState("");
  const [movieTrailer, setMovieTrailer] = useState("");
  const [movieCast, setMovieCast] = useState("");
  const [movieDirector, setMovieDirector] = useState("");

  // Theater Form State
  const [theaterName, setTheaterName] = useState("");
  const [theaterCity, setTheaterCity] = useState("");
  const [theaterAddress, setTheaterAddress] = useState("");
  const [theaterScreens, setTheaterScreens] = useState([{ screenNumber: "Screen 1", rows: 8, cols: 12 }]);

  // Show Form State
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [showStartTime, setShowStartTime] = useState("");
  const [showEndTime, setShowEndTime] = useState("");
  const [pricingGold, setPricingGold] = useState(200);
  const [pricingPlatinum, setPricingPlatinum] = useState(300);
  const [pricingVip, setPricingVip] = useState(400);

  // Coupon Form State
  const [cCode, setCCode] = useState("");
  const [cDiscountAmt, setCDiscountAmt] = useState(0);
  const [cDiscountPct, setCDiscountPct] = useState(0);
  const [cMinPurchase, setCMinPurchase] = useState(0);
  const [cExpiry, setCExpiry] = useState("");
  const [cIsActive, setCIsActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${user.token}` };

      // Fetch Metrics
      const metricsRes = await fetch("http://localhost:8000/api/admin/metrics", { headers });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      // Fetch Movies
      const moviesRes = await fetch("http://localhost:8000/api/movies");
      if (moviesRes.ok) {
        const data = await moviesRes.json();
        setMovies(data);
        if (data.length > 0) setSelectedMovieId(data[0].id);
      }

      // Fetch Theaters
      const theatersRes = await fetch("http://localhost:8000/api/theaters");
      if (theatersRes.ok) {
        const data = await theatersRes.json();
        setTheaters(data);
        if (data.length > 0) {
          setSelectedTheaterId(data[0].id);
          if (data[0].screens && data[0].screens.length > 0) {
            setSelectedScreenId(data[0].screens[0].id);
          }
        }
      }

      // Fetch Shows
      const showsRes = await fetch("http://localhost:8000/api/shows");
      if (showsRes.ok) {
        const data = await showsRes.json();
        setShows(data);
      }

      // Fetch Users
      const usersRes = await fetch("http://localhost:8000/api/admin/users", { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data);
      }

      // Fetch Coupons
      const couponsRes = await fetch("http://localhost:8000/api/admin/coupons", { headers });
      if (couponsRes.ok) {
        const data = await couponsRes.json();
        setCouponsList(data);
      }

    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Update screen choices when selected theater changes
  useEffect(() => {
    if (!selectedTheaterId) return;
    const theater = theaters.find(t => t.id === selectedTheaterId);
    if (theater && theater.screens && theater.screens.length > 0) {
      setSelectedScreenId(theater.screens[0].id);
    } else {
      setSelectedScreenId("");
    }
  }, [selectedTheaterId, theaters]);

  const handleAddMovie = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/admin/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          title: movieTitle,
          genre: movieGenre,
          duration: parseInt(movieDuration),
          description: movieDescription,
          rating: movieRating,
          releaseDate: movieReleaseDate,
          poster: moviePoster,
          banner: movieBanner,
          trailerUrl: movieTrailer,
          cast: movieCast,
          director: movieDirector
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Movie added successfully!");
        setMovieTitle("");
        setMovieGenre("");
        setMovieDuration("");
        setMovieDescription("");
        setMovieReleaseDate("");
        setMoviePoster("");
        setMovieBanner("");
        setMovieTrailer("");
        setMovieCast("");
        setMovieDirector("");
        fetchData();
      } else {
        setIsSuccess(false);
        setMessage("Failed to add movie.");
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage("Network error.");
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/movies/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchData();
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTheater = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/admin/theaters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: theaterName,
          city: theaterCity,
          address: theaterAddress,
          screens: theaterScreens
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Theater added successfully!");
        setTheaterName("");
        setTheaterCity("");
        setTheaterAddress("");
        setTheaterScreens([{ screenNumber: "Screen 1", rows: 8, cols: 12 }]);
        fetchData();
      } else {
        setIsSuccess(false);
        setMessage("Failed to add theater.");
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage("Network error.");
    }
  };

  const handleDeleteTheater = async (id) => {
    if (!window.confirm("Delete this theater?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/theaters/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchData();
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddShow = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!selectedMovieId || !selectedTheaterId || !selectedScreenId || !showStartTime || !showEndTime) {
      setMessage("Please fill in all show fields.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/admin/shows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          movieId: selectedMovieId,
          theaterId: selectedTheaterId,
          screenId: selectedScreenId,
          startTime: showStartTime,
          endTime: showEndTime,
          pricing: {
            Gold: parseFloat(pricingGold),
            Platinum: parseFloat(pricingPlatinum),
            VIP: parseFloat(pricingVip)
          }
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Show time scheduled successfully!");
        setShowStartTime("");
        setShowEndTime("");
        fetchData();
      } else {
        const data = await response.json();
        setIsSuccess(false);
        setMessage(data.message || "Failed to schedule show.");
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage("Network error.");
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm("Cancel this show?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/shows/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchData();
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Suspension Controls
  const handleSuspendUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setMessage("User account suspended");
        setIsSuccess(true);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setMessage("User account unsuspended");
        setIsSuccess(true);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user account permanently?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setMessage("User account deleted");
        setIsSuccess(true);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Coupon Manager
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          code: cCode.toUpperCase(),
          discountAmount: parseFloat(cDiscountAmt),
          discountPercentage: parseFloat(cDiscountPct),
          minPurchaseAmount: parseFloat(cMinPurchase),
          expiryDate: cExpiry,
          isActive: cIsActive
        })
      });

      if (response.ok) {
        setMessage("Coupon created successfully!");
        setIsSuccess(true);
        setCCode("");
        setCDiscountAmt(0);
        setCDiscountPct(0);
        setCMinPurchase(0);
        setCExpiry("");
        setCIsActive(true);
        fetchData();
      } else {
        setMessage("Failed to create coupon.");
        setIsSuccess(false);
      }
    } catch (err) {
      setMessage("Network error.");
      setIsSuccess(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatShowTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setMessage("");
    setIsSuccess(false);
  };

  if (loading && !metrics) {
    return <div className="container loading-placeholder">Loading admin dashboard metrics...</div>;
  }

  const selectedTheater = theaters.find(t => t.id === selectedTheaterId);
  const activeScreens = selectedTheater?.screens || [];

  // SVG Chart Computations
  const renderDailySalesChart = () => {
    if (!metrics || !metrics.dailyRevenue) return null;
    const days = Object.keys(metrics.dailyRevenue);
    const revenues = Object.values(metrics.dailyRevenue);
    const maxVal = Math.max(...revenues, 1000);
    const width = 500;
    const height = 180;
    const padding = 30;

    const points = days.map((day, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (days.length - 1);
      const y = height - padding - (revenues[idx] / maxVal) * (height - padding * 2);
      return { x, y, val: revenues[idx], label: day.slice(-5) };
    });

    const pathD = points.map((p, i) => (i === 0 ? "M" : "L") + ` ${p.x} ${p.y}`).join(" ");

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          );
        })}
        {/* Connection line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="var(--secondary)" strokeWidth="3" style={{ filter: "drop-shadow(0 2px 8px rgba(0, 242, 254, 0.4))" }} />
        )}
        {/* Points & Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--primary)" stroke="var(--secondary)" strokeWidth="2" />
            <text x={p.x} y={height - 8} fontSize="9" fill="var(--text-muted)" textAnchor="middle">{p.label}</text>
            <text x={p.x} y={p.y - 10} fontSize="9" fill="#fff" textAnchor="middle">₹{p.val.toFixed(0)}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 20px" }}>
      <div className="admin-header" style={{ textAlign: "left", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "24px" }}>
        <h1 style={{ fontSize: "2.25rem", margin: 0 }}>Admin Operations Dashboard</h1>
        <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)" }}>Manage platform catalogs, dynamically schedule multiplex showtimes, issue coupons, configure accounts, and inspect revenue analytics.</p>
      </div>

      {/* Tabs Row */}
      <div className="tabs-container admin-tabs" style={{ display: "flex", gap: "10px", margin: "24px 0 32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button className={`tab-btn ${activeTab === "metrics" ? "active" : ""}`} onClick={() => switchTab("metrics")}>Reporting & Stats</button>
        <button className={`tab-btn ${activeTab === "movies" ? "active" : ""}`} onClick={() => switchTab("movies")}>Manage Movies</button>
        <button className={`tab-btn ${activeTab === "theaters" ? "active" : ""}`} onClick={() => switchTab("theaters")}>Manage Theaters</button>
        <button className={`tab-btn ${activeTab === "shows" ? "active" : ""}`} onClick={() => switchTab("shows")}>Schedule Shows</button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => switchTab("users")}>Config Accounts</button>
        <button className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`} onClick={() => switchTab("coupons")}>Issue Coupons</button>
      </div>

      {message && (
        <div className={`status-message ${isSuccess ? "success" : "error"}`} style={{ marginBottom: "24px", textAlign: "left" }}>
          {message}
        </div>
      )}

      {/* 1. REPORTING & METRICS TAB */}
      {activeTab === "metrics" && metrics && (
        <div className="tab-content text-left">
          
          {/* Dashboard Cards */}
          <div className="metrics-cards-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <div className="glass-panel metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="metric-icon" style={{ fontSize: "2rem" }}>💰</span>
              <div className="metric-info">
                <h3 style={{ fontSize: "1.4rem", margin: 0 }}>₹{metrics.totalRevenue}</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Total Revenue</p>
              </div>
            </div>
            <div className="glass-panel metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="metric-icon" style={{ fontSize: "2rem" }}>🎟️</span>
              <div className="metric-info">
                <h3 style={{ fontSize: "1.4rem", margin: 0 }}>{metrics.totalBookings}</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Tickets Reserved</p>
              </div>
            </div>
            <div className="glass-panel metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="metric-icon" style={{ fontSize: "2rem" }}>🎬</span>
              <div className="metric-info">
                <h3 style={{ fontSize: "1.4rem", margin: 0 }}>{metrics.totalMovies}</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Active Movies</p>
              </div>
            </div>
            <div className="glass-panel metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="metric-icon" style={{ fontSize: "2rem" }}>🏢</span>
              <div className="metric-info">
                <h3 style={{ fontSize: "1.4rem", margin: 0 }}>{metrics.totalTheaters}</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Theaters Listed</p>
              </div>
            </div>
          </div>

          {/* SVG Analytics Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px", marginBottom: "32px" }}>
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", fontWeight: "600" }}>Daily Sales Analytics</h3>
              {renderDailySalesChart()}
            </div>
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", fontWeight: "600" }}>Seat Tiers Occupancy Gauge</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {Object.keys(metrics.seatOccupancy || {}).map((tier) => {
                  const pct = metrics.seatOccupancy[tier];
                  return (
                    <div key={tier}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                        <span>{tier} Class</span>
                        <strong style={{ color: "var(--secondary)" }}>{pct}% occupancy</strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(to right, var(--primary), var(--secondary))", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="admin-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            {/* Popular Movies Table */}
            <div className="glass-panel list-section" style={{ padding: "24px", borderRadius: "12px" }}>
              <h3>Popular Blockbusters</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Movie Title</th>
                    <th>Tickets Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.popularMovies && metrics.popularMovies.length > 0 ? (
                    metrics.popularMovies.map((pm, idx) => (
                      <tr key={idx}>
                        <td><strong>{pm.movieTitle}</strong></td>
                        <td>{pm.ticketsBooked} seats</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center">No tickets booked yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Bookings List */}
            <div className="glass-panel list-section" style={{ padding: "24px", borderRadius: "12px" }}>
              <h3>Recent Bookings</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Movie</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentBookings && metrics.recentBookings.length > 0 ? (
                    metrics.recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td><span className="ref-txt">{b.id}</span></td>
                        <td>{b.movieTitle}</td>
                        <td>₹{b.totalAmount}</td>
                        <td><span className={`lbl-status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">No bookings made yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE MOVIES TAB */}
      {activeTab === "movies" && (
        <div className="tab-content manage-content text-left">
          <div className="form-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Add New Movie</h3>
            <form onSubmit={handleAddMovie} className="admin-form">
              <div className="form-group">
                <label>Movie Title</label>
                <input type="text" className="form-input" value={movieTitle} onChange={e => setMovieTitle(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Genre</label>
                  <input type="text" placeholder="Action, Sci-Fi" className="form-input" value={movieGenre} onChange={e => setMovieGenre(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label>Duration (mins)</label>
                  <input type="number" className="form-input" value={movieDuration} onChange={e => setMovieDuration(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Rating Class</label>
                  <select className="form-input" value={movieRating} onChange={e => setMovieRating(e.target.value)}>
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adults Only)</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Release Date</label>
                  <input type="date" className="form-input" value={movieReleaseDate} onChange={e => setMovieReleaseDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Director</label>
                  <input type="text" className="form-input" value={movieDirector} onChange={e => setMovieDirector(e.target.value)} />
                </div>
                <div className="form-group flex-1">
                  <label>Cast (Comma Separated)</label>
                  <input type="text" placeholder="Actor 1, Actor 2" className="form-input" value={movieCast} onChange={e => setMovieCast(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Poster Image URL</label>
                <input type="text" placeholder="https://images.unsplash.com/..." className="form-input" value={moviePoster} onChange={e => setMoviePoster(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Banner Image URL (for Slider)</label>
                <input type="text" className="form-input" value={movieBanner} onChange={e => setMovieBanner(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Trailer Link</label>
                <input type="text" placeholder="https://youtube.com/watch?v=..." className="form-input" value={movieTrailer} onChange={e => setMovieTrailer(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Synopsis / Description</label>
                <textarea rows="3" className="form-input" value={movieDescription} onChange={e => setMovieDescription(e.target.value)} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>Save Movie</button>
            </form>
          </div>

          <div className="list-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Registered Movie List ({movies.length})</h3>
            <div className="item-scroll-list">
              {movies.map((m) => (
                <div key={m.id} className="admin-list-item">
                  <div className="item-text">
                    <strong>{m.title}</strong>
                    <p>{m.genre} • {m.duration} mins • Rated {m.rating}</p>
                  </div>
                  <button onClick={() => handleDeleteMovie(m.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MANAGE THEATERS TAB */}
      {activeTab === "theaters" && (
        <div className="tab-content manage-content text-left">
          <div className="form-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Add New Theater Multiplex</h3>
            <form onSubmit={handleAddTheater} className="admin-form">
              <div className="form-group">
                <label>Theater Name</label>
                <input type="text" placeholder="e.g. Cineverse IMAX" className="form-input" value={theaterName} onChange={e => setTheaterName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>City</label>
                  <input type="text" className="form-input" value={theaterCity} onChange={e => setTheaterCity(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label>Address</label>
                  <input type="text" className="form-input" value={theaterAddress} onChange={e => setTheaterAddress(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Screen Configurations</span>
                  <button type="button" className="btn-link" onClick={() => setTheaterScreens([...theaterScreens, { screenNumber: `Screen ${theaterScreens.length + 1}`, rows: 8, cols: 12 }])}>
                    + Add Screen
                  </button>
                </label>
                {theaterScreens.map((screen, idx) => (
                  <div key={idx} className="screen-row-form" style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <input type="text" className="form-input flex-1" value={screen.screenNumber} onChange={e => { const copy = [...theaterScreens]; copy[idx].screenNumber = e.target.value; setTheaterScreens(copy); }} required />
                    <input type="number" placeholder="Rows" className="form-input" style={{ width: "80px" }} value={screen.rows} onChange={e => { const copy = [...theaterScreens]; copy[idx].rows = parseInt(e.target.value); setTheaterScreens(copy); }} required />
                    <input type="number" placeholder="Cols" className="form-input" style={{ width: "80px" }} value={screen.cols} onChange={e => { const copy = [...theaterScreens]; copy[idx].cols = parseInt(e.target.value); setTheaterScreens(copy); }} required />
                    {theaterScreens.length > 1 && (
                      <button type="button" className="close-btn" onClick={() => setTheaterScreens(theaterScreens.filter((_, i) => i !== idx))}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "16px" }}>Save Theater</button>
            </form>
          </div>

          <div className="list-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Registered Theaters ({theaters.length})</h3>
            <div className="item-scroll-list">
              {theaters.map((t) => (
                <div key={t.id} className="admin-list-item">
                  <div className="item-text">
                    <strong>{t.name}</strong>
                    <p>{t.city} • {t.address}</p>
                    <span className="lbl-screens-count">{t.screens?.length} screens registered</span>
                  </div>
                  <button onClick={() => handleDeleteTheater(t.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SCHEDULE SHOWTIMES TAB */}
      {activeTab === "shows" && (
        <div className="tab-content manage-content text-left">
          <div className="form-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Schedule Movie Showtime</h3>
            <form onSubmit={handleAddShow} className="admin-form">
              <div className="form-group">
                <label>Select Movie</label>
                <select className="form-input" value={selectedMovieId} onChange={e => setSelectedMovieId(e.target.value)} required>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Select Theater</label>
                  <select className="form-input" value={selectedTheaterId} onChange={e => setSelectedTheaterId(e.target.value)} required>
                    {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Select Screen</label>
                  <select className="form-input" value={selectedScreenId} onChange={e => setSelectedScreenId(e.target.value)} required>
                    {activeScreens.map(s => <option key={s.id} value={s.id}>{s.screenNumber}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Start Date & Time</label>
                  <input type="datetime-local" className="form-input" value={showStartTime} onChange={e => setShowStartTime(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label>End Date & Time</label>
                  <input type="datetime-local" className="form-input" value={showEndTime} onChange={e => setShowEndTime(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Seat Class Prices (INR)</label>
                <div className="price-inputs-row" style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Gold Price</label>
                    <input type="number" className="form-input" value={pricingGold} onChange={e => setPricingGold(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Platinum Price</label>
                    <input type="number" className="form-input" value={pricingPlatinum} onChange={e => setPricingPlatinum(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>VIP Price</label>
                    <input type="number" className="form-input" value={pricingVip} onChange={e => setPricingVip(e.target.value)} required />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "16px" }}>Schedule Show</button>
            </form>
          </div>

          <div className="list-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Scheduled Shows ({shows.length})</h3>
            <div className="item-scroll-list">
              {shows.map((show) => (
                <div key={show.id} className="admin-list-item show-list-item">
                  <div className="item-text">
                    <strong>{show.movieTitle}</strong>
                    <p>{show.theaterName} • {show.screenNumber}</p>
                    <p className="show-time-txt" style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>{formatShowTime(show.startTime)}</p>
                    <span className={`status-pill ${show.status?.toLowerCase() || "upcoming"}`}>{show.status || "UPCOMING"}</span>
                  </div>
                  <button onClick={() => handleDeleteShow(show.id)} className="btn btn-danger btn-sm">Cancel Show</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIG USER ACCOUNTS TAB */}
      {activeTab === "users" && (
        <div className="tab-content text-left animate-scale-up">
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px" }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "20px" }}>Configure User Accounts</h3>
            <div className="item-scroll-list" style={{ maxHeight: "600px" }}>
              {usersList.map((u) => (
                <div key={u.id} className="admin-list-item" style={{ background: u.isSuspended ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.01)", borderColor: u.isSuspended ? "rgba(239,68,68,0.2)" : "var(--border-color)" }}>
                  <div className="item-text">
                    <strong style={{ fontSize: "1.1rem" }}>{u.name}</strong>
                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px", marginLeft: "10px", fontWeight: "600" }}>{u.role}</span>
                    <p style={{ margin: "4px 0 0 0" }}>{u.email}</p>
                    {u.isSuspended && <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>SUSPENDED</span>}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {u.role !== "ADMIN" && (
                      <>
                        {u.isSuspended ? (
                          <button onClick={() => handleUnsuspendUser(u.id)} className="btn btn-secondary btn-sm" style={{ background: "rgba(16,185,129,0.2)", color: "var(--accent-green)", border: "1px solid rgba(16,185,129,0.3)" }}>Unsuspend</button>
                        ) : (
                          <button onClick={() => handleSuspendUser(u.id)} className="btn btn-secondary btn-sm" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>Suspend</button>
                        )}
                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-sm">Delete Account</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ISSUE COUPONS TAB */}
      {activeTab === "coupons" && (
        <div className="tab-content manage-content text-left animate-scale-up">
          <div className="form-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Create Promotion Coupon</h3>
            <form onSubmit={handleAddCoupon} className="admin-form">
              <div className="form-group">
                <label>Coupon Promo Code</label>
                <input type="text" placeholder="e.g. CINE50" className="form-input" style={{ textTransform: "uppercase" }} value={cCode} onChange={e => setCCode(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Discount Value (INR)</label>
                  <input type="number" className="form-input" value={cDiscountAmt} onChange={e => setCDiscountAmt(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label>Discount Percentage (%)</label>
                  <input type="number" placeholder="Enter if using percentage" className="form-input" value={cDiscountPct} onChange={e => setCDiscountPct(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Min Purchase Amount (INR)</label>
                  <input type="number" className="form-input" value={cMinPurchase} onChange={e => setCMinPurchase(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label>Expiry Date</label>
                  <input type="date" className="form-input" value={cExpiry} onChange={e => setCExpiry(e.target.value)} required />
                </div>
              </div>
              <div className="form-group" style={{ flexDirection: "row", gap: "10px", alignItems: "center", marginTop: "8px" }}>
                <input type="checkbox" id="couponActive" checked={cIsActive} onChange={e => setCIsActive(e.target.checked)} style={{ cursor: "pointer", width: "18px", height: "18px" }} />
                <label htmlFor="couponActive" style={{ cursor: "pointer", fontSize: "0.85rem", textTransform: "none", margin: 0 }}>Activate Coupon for immediate checkout use</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "16px" }}>Save Promo Coupon</button>
            </form>
          </div>

          <div className="list-column glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3>Issued Coupons ({couponsList.length})</h3>
            <div className="item-scroll-list">
              {couponsList.map((c) => (
                <div key={c.id} className="admin-list-item" style={{ background: c.isActive ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.01)", borderColor: c.isActive ? "rgba(16,185,129,0.2)" : "var(--border-color)" }}>
                  <div className="item-text">
                    <strong style={{ fontSize: "1.1rem", color: "var(--secondary)" }}>{c.code}</strong>
                    <p style={{ margin: "4px 0 0 0" }}>
                      Discount: {c.discountPercentage > 0 ? `${c.discountPercentage}%` : `₹${c.discountAmount}`} • Min Buy: ₹{c.minPurchaseAmount}
                    </p>
                    <p style={{ margin: "2px 0 0 0" }}>Expires: {c.expiryDate}</p>
                    <span style={{ fontSize: "0.75rem", color: c.isActive ? "var(--accent-green)" : "#f87171", fontWeight: "700" }}>{c.isActive ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-header {
          text-align: left;
          margin-bottom: 32px;
          padding-top: 24px;
        }

        .admin-header h1 {
          font-size: 2.25rem;
          margin-bottom: 8px;
        }

        .admin-tabs {
          margin-bottom: 32px;
        }

        .metrics-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
        }

        .metric-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .metric-info h3 {
          font-size: 1.4rem;
          margin-bottom: 2px;
          color: var(--text-white);
        }

        .metric-info p {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .admin-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          text-align: left;
        }

        .list-section h3 {
          font-size: 1.25rem;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th, .admin-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }

        .admin-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .ref-txt {
          color: var(--secondary);
          font-family: monospace;
          font-weight: 600;
        }

        .lbl-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .lbl-status.confirmed { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
        .lbl-status.cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        /* Forms Layout for Management tab */
        .manage-content {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          text-align: left;
        }

        .form-column, .list-column {
          padding: 32px;
          min-height: 500px;
        }

        .form-column h3, .list-column h3 {
          font-size: 1.3rem;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .item-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .admin-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .item-text p {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .lbl-screens-count {
          font-size: 0.75rem;
          color: var(--secondary);
          font-weight: 600;
          margin-top: 4px;
          display: inline-block;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--secondary);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .screen-row-form .close-btn {
          font-size: 1.5rem;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
        }

        .price-inputs-row div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .show-time-txt {
          font-size: 0.8rem !important;
          color: var(--secondary) !important;
          margin-top: 4px;
        }

        .status-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          display: inline-block;
          margin-top: 6px;
        }

        .status-pill.upcoming { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .status-pill.running { background: rgba(234, 179, 8, 0.15); color: #eab308; }
        .status-pill.completed { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }

        @media (max-width: 1024px) {
          .admin-layout-grid, .manage-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
