import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState("bookings"); // bookings, profile, wishlist, notifications, saved-cards
  const [bookings, setBookings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Mock saved cards list in local state
  const [savedCards, setSavedCards] = useState([
    { id: "card1", brand: "Visa", last4: "4242", exp: "12/28" },
    { id: "card2", brand: "Mastercard", last4: "8899", exp: "06/27" }
  ]);

  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");
  const [cardMsg, setCardMsg] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch User Bookings
      const bookingsRes = await fetch("http://localhost:8000/api/bookings/my-bookings", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }

      // Fetch All Movies
      const moviesRes = await fetch("http://localhost:8000/api/movies");
      if (moviesRes.ok) {
        const data = await moviesRes.json();
        setMovies(data);
      }

      // Fetch Profile for fresh wishlist
      const profileRes = await fetch("http://localhost:8000/api/auth/profile", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setWishlist(data.wishlist || []);
      }

      // Fetch User Notifications
      const notifRes = await fetch("http://localhost:8000/api/bookings/notifications", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleDownloadPdf = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/pdf`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download ticket receipt.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancelLoadingId(bookingId);
    try {
      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "CANCELLED" } : b));
        fetchDashboardData(); // Refresh notifications & bookings
      } else {
        const data = await response.json();
        alert(data.message || "Failed to cancel booking.");
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  // Mark notification as read
  const handleMarkRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/bookings/notifications/${id}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/bookings/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove from Wishlist
  const handleRemoveWishlist = async (movieId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${movieId}/wishlist`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.wishlist || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Card Simulation
  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCardNumber || !newCardExpiry || !newCardCvv) return;
    const cardBrand = newCardNumber.startsWith("4") ? "Visa" : "Mastercard";
    const newCardObj = {
      id: "card-" + Date.now(),
      brand: cardBrand,
      last4: newCardNumber.slice(-4),
      exp: newCardExpiry
    };
    setSavedCards([...savedCards, newCardObj]);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCvv("");
    setCardMsg("Card saved successfully!");
    setTimeout(() => setCardMsg(""), 3000);
  };

  // Delete Card Simulation
  const handleDeleteCard = (id) => {
    setSavedCards(savedCards.filter(c => c.id !== id));
  };

  const calculateShowStatus = (showTimeStr) => {
    if (!showTimeStr) return "UPCOMING";
    const startTime = new Date(showTimeStr);
    const now = new Date();
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
    
    if (now < startTime) {
      return { label: "UPCOMING", className: "upcoming-badge" };
    } else if (now > endTime) {
      return { label: "COMPLETED", className: "completed-badge" };
    } else {
      return { label: "RUNNING", className: "running-badge" };
    }
  };

  const formatDateTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const wishlistedMovies = movies.filter(m => wishlist.includes(m.id));
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <div className="container loading-placeholder">Loading user dashboard...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 20px" }}>
      <div className="dashboard-hero" style={{ marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "24px" }}>
        <div style={{ textAlign: "left" }}>
          <h1 style={{ fontSize: "2.25rem", margin: 0 }}>Welcome Back, {user?.name}!</h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)" }}>Manage your active tickets, profile details, wishlist, and platform notifications.</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="tabs-container" style={{ display: "flex", gap: "10px", margin: "24px 0 32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button 
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          My Bookings
        </button>
        <button 
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button 
          className={`tab-btn ${activeTab === "wishlist" ? "active" : ""}`}
          onClick={() => setActiveTab("wishlist")}
        >
          Wishlist ({wishlist.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
          style={{ position: "relative" }}
        >
          Notifications
          {unreadNotifs > 0 && (
            <span style={{ position: "absolute", top: "-6px", right: "-10px", background: "var(--primary)", color: "#fff", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: "700" }}>
              {unreadNotifs}
            </span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === "saved-cards" ? "active" : ""}`}
          onClick={() => setActiveTab("saved-cards")}
        >
          Saved Cards
        </button>
      </div>

      {/* 1. BOOKINGS HISTORY TAB */}
      {activeTab === "bookings" && (
        <div className="tab-content text-left">
          {bookings.length > 0 ? (
            <div className="bookings-list-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {bookings.map((booking) => {
                const showStatus = calculateShowStatus(booking.showStartTime);
                const isUpcoming = showStatus.label === "UPCOMING" && booking.status === "CONFIRMED";
                
                return (
                  <div key={booking.id} className={`glass-panel booking-history-card ${booking.status.toLowerCase()}`}>
                    <div className="booking-card-header">
                      <div className="title-area">
                        <span className={`status-pill ${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                        <span className={`status-pill ${showStatus.className}`}>
                          {showStatus.label}
                        </span>
                      </div>
                      <span className="booking-date-text">
                        Booked: {formatDateTime(booking.timestamp)}
                      </span>
                    </div>

                    <div className="booking-card-body">
                      {booking.moviePoster ? (
                        <img src={booking.moviePoster} alt={booking.movieTitle} className="booking-card-poster" />
                      ) : (
                        <div className="booking-card-poster" style={{ background: "#1a133d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🎬</div>
                      )}
                      
                      <div className="booking-card-info">
                        <h3>{booking.movieTitle}</h3>
                        <p className="booking-theater-detail">
                          {booking.theaterName} • {booking.screenNumber}
                        </p>
                        <p className="booking-time-detail">
                          Showtime: <strong>{formatDateTime(booking.showStartTime)}</strong>
                        </p>
                        
                        <div className="booking-details-grid">
                          <div>
                            <label>Seats Booked</label>
                            <span>{booking.seats.join(", ")}</span>
                          </div>
                          <div>
                            <label>Booking Reference</label>
                            <span className="ref-highlight">{booking.id}</span>
                          </div>
                          <div>
                            <label>Total Price</label>
                            <span>₹{booking.totalAmount}</span>
                          </div>
                        </div>
                      </div>

                      {booking.qrCodeBase64 && booking.status === "CONFIRMED" && (
                        <div 
                          className="qr-code-wrapper"
                          onClick={() => setSelectedQrCode(booking.qrCodeBase64)}
                          title="Click to zoom QR Code"
                        >
                          <img src={booking.qrCodeBase64} alt="Booking QR" className="qr-thumbnail" />
                          <span className="qr-zoom-lbl">Click to Zoom</span>
                        </div>
                      )}
                    </div>

                    <div className="booking-card-actions">
                      <button 
                        onClick={() => handleDownloadPdf(booking.id)}
                        className="btn btn-secondary btn-sm"
                        disabled={booking.status === "CANCELLED"}
                      >
                        Download PDF Receipt
                      </button>
                      
                      {isUpcoming && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn btn-danger btn-sm"
                          disabled={cancelLoadingId === booking.id}
                        >
                          {cancelLoadingId === booking.id ? "Cancelling..." : "Cancel Reservation"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel no-bookings-placeholder" style={{ padding: "60px 20px", textAlign: "center" }}>
              <span>🎟️</span>
              <h3>No Bookings Found</h3>
              <p>You haven't reserved any movie tickets yet. Head over to booking and grab some popcorn!</p>
              <Link to="/booking" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-block" }}>
                Book Your First Ticket
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="tab-content text-left animate-scale-up" style={{ maxWidth: "550px" }}>
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, var(--secondary), var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: "700", color: "#000" }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: "1.3rem", margin: 0 }}>{user?.name}</h3>
                <span style={{ fontSize: "0.75rem", background: "rgba(0, 242, 254, 0.15)", color: "var(--secondary)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>{user?.role}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Registered Email</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "500" }}>{user?.email}</p>
              </div>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Account ID</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "500", fontFamily: "monospace", color: "var(--secondary)" }}>{user?.id}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Country / Region</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "500" }}>India</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. WISHLIST TAB */}
      {activeTab === "wishlist" && (
        <div className="tab-content text-left">
          {wishlistedMovies.length > 0 ? (
            <div className="showcase-grid">
              {wishlistedMovies.map((movie) => (
                <div key={movie.id} className="glass-panel showcase-card">
                  <div className="showcase-poster-wrapper">
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} className="showcase-poster-img" />
                    ) : (
                      <div className="showcase-poster-fallback">🎬</div>
                    )}
                    <button 
                      onClick={() => handleRemoveWishlist(movie.id)}
                      style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: "#ef4444", zIndex: 20 }}
                      title="Remove from Wishlist"
                    >
                      ♥
                    </button>
                  </div>
                  <div className="showcase-info">
                    <div>
                      <span className="showcase-genre">{movie.genre}</span>
                      <h3>{movie.title}</h3>
                    </div>
                    <div className="showcase-footer">
                      <span className="movie-rating">★ {getAverageRating(movie)}</span>
                      <Link to="/movies" state={{ selectedMovieId: movie.id }} className="showcase-btn" style={{ fontSize: "0.8rem" }}>
                        View Info
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              <span>♥</span>
              <h3>Your Wishlist is Empty</h3>
              <p>Mark movies with a heart when browsing the catalog to save them here.</p>
              <Link to="/movies" className="btn btn-primary animate-pulse" style={{ marginTop: "16px", display: "inline-block" }}>
                Browse Movies Catalog
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="tab-content text-left animate-scale-up" style={{ maxWidth: "700px" }}>
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", margin: 0 }}>My Notifications</h3>
              {notifications.some(n => !n.isRead) && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="btn btn-secondary btn-sm"
                >
                  Mark All as Read
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    style={{ background: n.isRead ? "rgba(255,255,255,0.01)" : "rgba(159, 43, 255, 0.05)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", position: "relative" }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{n.title}</strong>
                        {!n.isRead && <span style={{ width: "8px", height: "8px", background: "var(--primary)", borderRadius: "50%" }}></span>}
                      </div>
                      <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>{n.message}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(n.timestamp).toLocaleString()}</span>
                    </div>

                    {!n.isRead && (
                      <button 
                        onClick={() => handleMarkRead(n.id)}
                        className="btn-link"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                  <span>🔔</span>
                  <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>No notifications available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SAVED CARDS TAB */}
      {activeTab === "saved-cards" && (
        <div className="tab-content text-left" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px" }}>
          
          {/* Left: Saved cards list */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "20px" }}>Saved Credit / Debit Cards</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {savedCards.length > 0 ? (
                savedCards.map((c) => (
                  <div key={c.id} className="admin-list-item" style={{ background: "linear-gradient(135deg, rgba(26,17,57,0.5), rgba(0,242,254,0.05))" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "2rem" }}>💳</span>
                      <div>
                        <strong style={{ fontSize: "1rem" }}>{c.brand} **** {c.last4}</strong>
                        <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>Expires {c.exp}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCard(c.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove Card
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                  <p>No saved payment cards found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Add Card Form */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "20px" }}>Save New Card</h3>
            <form onSubmit={handleAddCard} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  maxLength="16"
                  placeholder="4111 2222 3333 4444"
                  className="form-input"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    maxLength="5"
                    placeholder="MM/YY"
                    className="form-input"
                    value={newCardExpiry}
                    onChange={(e) => setNewCardExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>CVC / CVV</label>
                  <input
                    type="password"
                    maxLength="3"
                    placeholder="•••"
                    className="form-input"
                    value={newCardCvv}
                    onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              {cardMsg && <div style={{ fontSize: "0.85rem", color: "var(--accent-green)" }}>{cardMsg}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>Save Card Mode</button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Zoom Modal */}
      {selectedQrCode && (
        <div className="modal-overlay" onClick={() => setSelectedQrCode(null)}>
          <div className="glass-panel modal-card qr-zoom-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Your Ticket QR Code</h3>
              <button className="close-btn" onClick={() => setSelectedQrCode(null)}>×</button>
            </div>
            <div className="qr-zoom-body">
              <img src={selectedQrCode} alt="Ticket QR Zoom" className="qr-large" />
              <p>Show this code at the theater multiplex checkpoint for admission scanning.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;