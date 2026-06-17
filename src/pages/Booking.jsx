import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

function Booking({ user }) {
  const location = useLocation();
  const initialMovieTitle = location.state?.movieTitle || "";

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");

  // Payment method selection
  const [paymentGateway, setPaymentGateway] = useState("STRIPE"); // STRIPE, RAZORPAY, SAVED_CARD
  const [upiId, setUpiId] = useState("");
  const [netbankBank, setNetbankBank] = useState("SBI");
  const [selectedSavedCard, setSelectedSavedCard] = useState("card1");

  // Mock saved cards list
  const savedCards = [
    { id: "card1", brand: "Visa", last4: "4242", exp: "12/28" },
    { id: "card2", brand: "Mastercard", last4: "8899", exp: "06/27" }
  ];

  // Fetch all movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/movies");
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
          
          // Select default movie
          if (data.length > 0) {
            const matched = data.find(m => m.title === initialMovieTitle) || data[0];
            setSelectedMovie(matched);
          }
        }
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [initialMovieTitle]);

  // Fetch showtimes for selected movie
  useEffect(() => {
    if (!selectedMovie) return;
    const fetchShows = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/shows?movieId=${selectedMovie.id}`);
        if (response.ok) {
          const data = await response.json();
          setShows(data);
          if (data.length > 0) {
            const matchedShow = data.find(s => s.id === location.state?.showId) || data[0];
            setSelectedShow(matchedShow);
          } else {
            setSelectedShow(null);
          }
          setSelectedSeats([]); // reset selected seats
          setErrorMessage("");
        }
      } catch (err) {
        console.error("Failed to fetch shows:", err);
      }
    };
    fetchShows();
  }, [selectedMovie]);

  // Determine row and column structures based on screen configuration
  // Fallback to 6 rows and 10 cols if layout is not specified in show configuration
  // For the visual grid, we can define rows as letters A-Z and columns as 1-N.
  const rowCount = 8; 
  const colCount = 12;

  const rows = Array.from({ length: rowCount }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
  const cols = Array.from({ length: colCount }, (_, i) => i + 1); // 1, 2, 3, ...

  const getSeatCategoryAndPrice = (rowLabel) => {
    // A-B: VIP (400), C-E: Platinum (300), F-H: Gold (200)
    let category = "Gold";
    let price = 200;
    
    if (rowLabel === "A" || rowLabel === "B") {
      category = "VIP";
      price = selectedShow?.pricing?.VIP || 400;
    } else if (rowLabel === "C" || rowLabel === "D" || rowLabel === "E") {
      category = "Platinum";
      price = selectedShow?.pricing?.Platinum || 300;
    } else {
      category = "Gold";
      price = selectedShow?.pricing?.Gold || 200;
    }
    
    return { category, price };
  };

  const calculateTotalAmount = () => {
    return selectedSeats.reduce((total, seat) => {
      const rowLabel = seat.charAt(0);
      return total + getSeatCategoryAndPrice(rowLabel).price;
    }, 0);
  };

  const handleSeatClick = (seatId) => {
    if (!selectedShow) return;
    const isBooked = selectedShow.bookedSeats?.includes(seatId);
    if (isBooked) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const triggerPaymentFlow = () => {
    if (selectedSeats.length === 0) return;
    setShowPaymentModal(true);
    setErrorMessage("");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponMessage("");
    try {
      const originalAmount = calculateTotalAmount();
      const response = await fetch(`http://localhost:8000/api/bookings/validate-coupon?code=${couponCode.trim().toUpperCase()}&amount=${originalAmount}`);
      const data = await response.json();
      if (response.ok) {
        setCouponApplied(true);
        setCouponDiscount(data.discount);
        setCouponMessage(`Coupon applied successfully! Saved ₹${data.discount}`);
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponError(data.message || "Failed to apply coupon.");
      }
    } catch (err) {
      setCouponError("Error checking coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validation based on payment method
    if (paymentGateway === "STRIPE") {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        setErrorMessage("Please fill in all card details (Card Number, Expiry, CVV, Cardholder Name).");
        return;
      }
    } else if (paymentGateway === "RAZORPAY") {
      // If user provided a UPI ID, validate it
      if (upiId) {
        if (!upiId.includes("@")) {
          setErrorMessage("Please enter a valid UPI ID (e.g., username@bank).");
          return;
        }
      } else {
        // Otherwise validate card details
        if (!cardNumber || !cardExpiry || !cardCvv) {
          setErrorMessage("Please enter Card details or provide a UPI ID.");
          return;
        }
      }
    } else if (paymentGateway === "SAVED_CARD") {
      if (!cardCvv) {
        setErrorMessage("Please enter the CVV security code.");
        return;
      }
    }

    setIsPaying(true);

    try {
      const originalAmount = calculateTotalAmount();
      const response = await fetch("http://localhost:8000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          showId: selectedShow.id,
          seats: selectedSeats,
          paymentMethod: paymentGateway,
          totalAmount: originalAmount,
          couponCode: couponApplied ? couponCode.toUpperCase() : ""
        })
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmedBooking(data);
        setBookingConfirmed(true);
        setShowPaymentModal(false);
        // Clear card inputs
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setCardName("");
        setUpiId("");
        // Reset coupon
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponCode("");
        setCouponMessage("");
      } else {
        setErrorMessage(data.message || "Failed to place booking. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to backend.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleReset = () => {
    setSelectedSeats([]);
    setBookingConfirmed(false);
    setConfirmedBooking(null);
    setErrorMessage("");
    // Refresh shows list to get latest booked seats
    if (selectedMovie) {
      const fetchShows = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/shows?movieId=${selectedMovie.id}`);
          if (response.ok) {
            const data = await response.json();
            setShows(data);
            if (data.length > 0) {
              // find the previously selected show
              const current = data.find(s => s.id === selectedShow.id) || data[0];
              setSelectedShow(current);
            }
          }
        } catch (err) {
          console.error("Refresh shows failed:", err);
        }
      };
      fetchShows();
    }
  };

  const formatShowTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return timeStr;
    }
  };

  if (loading) {
    return <div className="container loading-placeholder">Loading Seat Layout...</div>;
  }

  return (
    <div className="container animate-fade-in">
      {!bookingConfirmed ? (
        <div className="booking-layout">
          {/* Main Seat Selector Grid */}
          <div className="glass-panel booking-main">
            <div className="main-header-row">
              <h2>Select Your Seats</h2>
              {selectedShow && (
                <span className="selected-screen-badge">
                  {selectedShow.theaterName} - {selectedShow.screenNumber}
                </span>
              )}
            </div>

            {selectedShow ? (
              <>
                <div className="screen-container">
                  <div className="screen-indicator"></div>
                  <div className="screen-label">SCREEN THIS WAY</div>
                </div>

                <div className="seat-grid-scroll-wrapper">
                  <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                    {rows.map((row) =>
                      cols.map((col) => {
                        const seatId = `${row}${col}`;
                        const isReserved = selectedShow.bookedSeats?.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        const { category } = getSeatCategoryAndPrice(row);

                        return (
                          <button
                            key={seatId}
                            className={`seat ${isReserved ? "reserved" : ""} ${isSelected ? "selected" : ""} seat-${category.toLowerCase()}`}
                            onClick={() => handleSeatClick(seatId)}
                            disabled={isReserved}
                            title={`Seat ${seatId} (${category} - ₹${getSeatCategoryAndPrice(row).price})`}
                          >
                            {seatId}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="legend-container">
                  <div className="legend-item">
                    <div className="legend-color seat-gold"></div>
                    <span>Gold (₹{selectedShow.pricing?.Gold || 200})</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color seat-platinum"></div>
                    <span>Platinum (₹{selectedShow.pricing?.Platinum || 300})</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color seat-vip"></div>
                    <span>VIP (₹{selectedShow.pricing?.VIP || 400})</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color legend-selected"></div>
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color legend-reserved"></div>
                    <span>Reserved</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-shows-alert">
                <span>📅</span>
                <h3>No Available Shows</h3>
                <p>There are no current show schedules for this movie. Please select a different film from the sidebar.</p>
              </div>
            )}
          </div>

          {/* Sidebar Booking Details */}
          <div className="glass-panel booking-sidebar">
            <h2>Booking Summary</h2>
            
            {/* Movie selection */}
            <div className="summary-section">
              <label>Choose Movie</label>
              <select 
                value={selectedMovie ? selectedMovie.title : ""} 
                onChange={(e) => {
                  const match = movies.find(m => m.title === e.target.value);
                  setSelectedMovie(match);
                }}
                className="form-input select-movie"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.title}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Showtime Selection */}
            {shows.length > 0 && (
              <div className="summary-section">
                <label>Available Showtimes</label>
                <div className="time-grid">
                  {shows.map((showItem) => (
                    <button
                      key={showItem.id}
                      className={`time-pill ${selectedShow?.id === showItem.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedShow(showItem);
                        setSelectedSeats([]); // Clear selected seats when changing show
                      }}
                    >
                      {formatShowTime(showItem.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedShow && (
              <div className="summary-checkout">
                <div className="checkout-row">
                  <span>Selected Seats:</span>
                  <span className="seats-list">
                    {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                  </span>
                </div>
                <div className="checkout-row">
                  <span>Total Tickets:</span>
                  <span>{selectedSeats.length}</span>
                </div>
                <div className="checkout-row">
                  <span>Original Price:</span>
                  <span>₹{calculateTotalAmount()}</span>
                </div>

                {/* Coupon Application Panel */}
                <div className="coupon-panel" style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Coupon Code</label>
                  {!couponApplied ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="ENTER COUPON"
                        className="form-input"
                        style={{ textTransform: "uppercase", flex: 1, padding: "8px", height: "36px", fontSize: "0.85rem" }}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary btn-sm" style={{ padding: "0 12px", height: "36px" }}>Apply</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                      <div>
                        <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>{couponCode.toUpperCase()}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>(-₹{couponDiscount})</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="close-btn" style={{ fontSize: "1.2rem", padding: 0 }}>×</button>
                    </div>
                  )}
                  {couponError && <div style={{ fontSize: "0.75rem", color: "#f87171", marginTop: "6px" }}>{couponError}</div>}
                  {couponMessage && <div style={{ fontSize: "0.75rem", color: "var(--accent-green)", marginTop: "6px" }}>{couponMessage}</div>}
                </div>

                <div className="checkout-total" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px" }}>
                  <span>Final Payable:</span>
                  <span>₹{couponApplied ? Math.max(0, calculateTotalAmount() - couponDiscount) : calculateTotalAmount()}</span>
                </div>
                
                {errorMessage && (
                  <div className="status-message error" style={{ marginTop: "12px" }}>
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={triggerPaymentFlow}
                  className="btn btn-primary confirm-btn"
                  disabled={selectedSeats.length === 0}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="glass-panel success-panel animate-fade-in">
          <div className="success-icon">🎉</div>
          <h1>Booking Confirmed!</h1>
          <p>Your ticket reference is: <strong className="id-highlight">{confirmedBooking?.id}</strong>. Confirmation receipt has been sent to your email.</p>

          <div className="ticket-summary-card">
            <div className="ticket-sum-header-row">
              <div className="ticket-sum-header">
                <h3>{confirmedBooking?.movieTitle}</h3>
                <p>{formatShowTime(confirmedBooking?.showStartTime)}</p>
              </div>
              {confirmedBooking?.qrCodeBase64 && (
                <img 
                  src={confirmedBooking.qrCodeBase64} 
                  alt="Ticket QR Code" 
                  className="ticket-qr-thumbnail"
                />
              )}
            </div>
            <div className="ticket-sum-body">
              <div className="sum-detail">
                <span className="sum-label">Ticket ID</span>
                <span className="sum-value">{confirmedBooking?.id}</span>
              </div>
              <div className="sum-detail">
                <span className="sum-label">Seats Booked</span>
                <span className="sum-value font-highlight">{confirmedBooking?.seats?.join(", ")}</span>
              </div>
              <div className="sum-detail">
                <span className="sum-label">Theater Screen</span>
                <span className="sum-value">{confirmedBooking?.theaterName} ({confirmedBooking?.screenNumber})</span>
              </div>
              <div className="sum-detail">
                <span className="sum-label">Total Amount Paid</span>
                <span className="sum-value font-highlight">₹{confirmedBooking?.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              Go to My Dashboard
            </Link>
            <button onClick={handleReset} className="btn btn-primary">
              Book More Tickets
            </button>
          </div>
        </div>
      )}

      {/* Payment simulation modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-scale-up" style={{ maxWidth: "480px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem" }}>Secure Checkout</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Choose a premium payment provider</p>
              </div>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            {/* Gateway Provider Selection Tabs */}
            <div style={{ display: "flex", gap: "10px", margin: "16px 0", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                type="button"
                onClick={() => { setPaymentGateway("STRIPE"); setErrorMessage(""); }}
                style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem", transition: "all 0.3s", background: paymentGateway === "STRIPE" ? "linear-gradient(to right, #635bff, #80e9ff)" : "transparent", color: paymentGateway === "STRIPE" ? "#000" : "var(--text-muted)" }}
              >
                Stripe
              </button>
              <button
                type="button"
                onClick={() => { setPaymentGateway("RAZORPAY"); setErrorMessage(""); }}
                style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem", transition: "all 0.3s", background: paymentGateway === "RAZORPAY" ? "linear-gradient(to right, #0029ff, #00d2ff)" : "transparent", color: paymentGateway === "RAZORPAY" ? "#fff" : "var(--text-muted)" }}
              >
                Razorpay
              </button>
              <button
                type="button"
                onClick={() => { setPaymentGateway("SAVED_CARD"); setErrorMessage(""); }}
                style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem", transition: "all 0.3s", background: paymentGateway === "SAVED_CARD" ? "rgba(255, 255, 255, 0.1)" : "transparent", color: "var(--text-white)" }}
              >
                Saved Cards
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="payment-form">
              <div className="amount-display-row" style={{ marginBottom: "16px" }}>
                <span>Total Amount Payable:</span>
                <strong className="amount-highlight" style={{ fontSize: "1.3rem", color: "var(--secondary)" }}>
                  ₹{couponApplied ? Math.max(0, calculateTotalAmount() - couponDiscount) : calculateTotalAmount()}
                </strong>
              </div>

              {/* STRIPE GATEWAY */}
              {paymentGateway === "STRIPE" && (
                <div className="stripe-gateway-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                    <span style={{ fontSize: "0.75rem", letterSpacing: "0.05em", color: "#635bff", fontWeight: "700" }}>STRIPE SECURE</span>
                    <span style={{ fontSize: "1.2rem" }}>💳</span>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={isPaying}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      maxLength="16"
                      className="form-input"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                      disabled={isPaying}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        maxLength="5"
                        className="form-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        disabled={isPaying}
                        required
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>CVC</label>
                      <input
                        type="password"
                        maxLength="3"
                        className="form-input"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        disabled={isPaying}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RAZORPAY GATEWAY */}
              {paymentGateway === "RAZORPAY" && (
                <div className="razorpay-gateway-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                    <span style={{ fontSize: "0.75rem", letterSpacing: "0.05em", color: "#00d2ff", fontWeight: "700" }}>RAZORPAY SECURE</span>
                    <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  </div>

                  <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Select Mode</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setUpiId("")}
                        className={`btn btn-sm ${!upiId ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1 }}
                      >
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiId("user@paytm")}
                        className={`btn btn-sm ${upiId ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1 }}
                      >
                        UPI
                      </button>
                    </div>
                  </div>

                  {upiId ? (
                    <div className="form-group">
                      <label>UPI ID (VPA)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="username@bank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={isPaying}
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          maxLength="16"
                          className="form-input"
                          placeholder="5111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                          disabled={isPaying}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group flex-1">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            maxLength="5"
                            className="form-input"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            disabled={isPaying}
                            required
                          />
                        </div>
                        <div className="form-group flex-1">
                          <label>CVV</label>
                          <input
                            type="password"
                            maxLength="3"
                            className="form-input"
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            disabled={isPaying}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SAVED CARDS */}
              {paymentGateway === "SAVED_CARD" && (
                <div className="saved-cards-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                    <span style={{ fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--secondary)", fontWeight: "700" }}>SAVED METHODS</span>
                    <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  </div>

                  <div className="form-group">
                    <label>Select Card</label>
                    <select
                      className="form-input"
                      value={selectedSavedCard}
                      onChange={(e) => setSelectedSavedCard(e.target.value)}
                      style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-white)" }}
                    >
                      {savedCards.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: "#0f0a1c" }}>
                          {c.brand} ending in {c.last4} (Exp: {c.exp})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ width: "120px" }}>
                    <label>Security CVV</label>
                    <input
                      type="password"
                      maxLength="3"
                      className="form-input"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                      disabled={isPaying}
                      required
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="status-message error" style={{ marginTop: "16px" }}>
                  {errorMessage}
                </div>
              )}

              <button type="submit" className="btn btn-primary pay-btn" disabled={isPaying} style={{ marginTop: "20px" }}>
                {isPaying ? "Processing Secure Payment..." : `Confirm Payment: ₹${couponApplied ? Math.max(0, calculateTotalAmount() - couponDiscount) : calculateTotalAmount()}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .booking-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          text-align: left;
          padding-top: 24px;
        }

        .booking-main, .booking-sidebar {
          padding: 32px;
          min-height: 500px;
        }

        .main-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .selected-screen-badge {
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: var(--secondary);
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .screen-container {
          margin: 0 auto 36px;
          max-width: 500px;
          text-align: center;
        }

        .screen-indicator {
          height: 8px;
          background: linear-gradient(to right, transparent, var(--secondary), transparent);
          border-radius: 50%;
          box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);
          margin-bottom: 10px;
        }

        .screen-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.15em;
        }

        .seat-grid-scroll-wrapper {
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .seat-grid {
          display: grid;
          gap: 8px;
          justify-content: center;
          margin: 0 auto;
          min-width: 500px;
        }

        .seat {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 500;
          height: 32px;
          width: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .seat:hover:not(:disabled) {
          border-color: var(--secondary);
          color: var(--text-white);
          transform: scale(1.1);
        }

        .seat-gold {
          background: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.3);
        }
        .seat-gold:hover:not(:disabled) {
          background: rgba(234, 179, 8, 0.2);
        }

        .seat-platinum {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .seat-platinum:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.2);
        }

        .seat-vip {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.3);
        }
        .seat-vip:hover:not(:disabled) {
          background: rgba(168, 85, 247, 0.2);
        }

        .seat.selected {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
          color: var(--text-white) !important;
          box-shadow: var(--shadow-neon);
        }

        .seat.reserved {
          background: rgba(255, 255, 255, 0.02) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
          color: rgba(255, 255, 255, 0.1) !important;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .legend-container {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 36px;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        .legend-color.seat-gold { background: rgba(234, 179, 8, 0.15); border-color: rgba(234, 179, 8, 0.4); }
        .legend-color.seat-platinum { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }
        .legend-color.seat-vip { background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.4); }
        .legend-color.legend-selected { background: var(--primary); border-color: var(--primary); }
        .legend-color.legend-reserved { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }

        .no-shows-alert {
          text-align: center;
          padding: 80px 20px;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
        }

        .no-shows-alert span {
          font-size: 3rem;
          display: inline-block;
          margin-bottom: 16px;
        }

        .summary-section {
          margin-bottom: 24px;
        }

        .summary-section label {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 10px;
        }

        .select-movie {
          background-color: rgba(255, 255, 255, 0.04);
          cursor: pointer;
        }

        .select-movie option {
          background-color: var(--bg-panel);
          color: var(--text-white);
        }

        .time-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .time-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          padding: 10px;
          border-radius: 8px;
          font-family: var(--font-title);
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          text-align: left;
        }

        .time-pill:hover {
          color: var(--text-white);
          border-color: var(--primary);
        }

        .time-pill.active {
          background: var(--primary);
          color: var(--text-white);
          border-color: var(--primary);
          box-shadow: var(--shadow-neon);
        }

        .summary-checkout {
          border-top: 1px dashed var(--border-color);
          padding-top: 24px;
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkout-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .seats-list {
          color: var(--text-white);
          font-weight: 600;
        }

        .checkout-total {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          margin-top: 4px;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-white);
        }

        .checkout-total span:last-child {
          color: var(--secondary);
          text-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }

        .confirm-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          margin-top: 24px;
        }

        /* Success Panel Styles */
        .success-panel {
          max-width: 650px;
          margin: 40px auto;
          padding: 48px;
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .id-highlight {
          color: var(--secondary);
        }

        .ticket-summary-card {
          background: linear-gradient(135deg, rgba(26, 17, 57, 0.8), rgba(17, 13, 38, 0.6));
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px 28px;
          text-align: left;
          margin-bottom: 36px;
          position: relative;
        }

        .ticket-sum-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 16px;
          margin-bottom: 16px;
          gap: 16px;
        }

        .ticket-sum-header h3 {
          font-size: 1.35rem;
          margin-bottom: 4px;
        }

        .ticket-sum-header p {
          margin-bottom: 0;
          color: var(--secondary);
          font-weight: 500;
        }

        .ticket-qr-thumbnail {
          width: 70px;
          height: 70px;
          border-radius: 6px;
          background: #fff;
          padding: 4px;
          border: 1px solid var(--border-color);
        }

        .sum-detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .sum-label {
          color: var(--text-muted);
        }

        .sum-value {
          font-weight: 500;
          color: var(--text-white);
        }

        .font-highlight {
          color: var(--secondary) !important;
          font-weight: 700;
        }

        .success-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(7, 5, 18, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          width: 100%;
          max-width: 440px;
          padding: 32px;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.75rem;
          cursor: pointer;
          line-height: 1;
        }

        .close-btn:hover {
          color: var(--text-white);
        }

        .amount-display-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.05rem;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .amount-highlight {
          color: var(--secondary);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 {
          flex: 1;
        }

        .pay-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          margin-top: 12px;
        }

        @media (max-width: 1024px) {
          .booking-layout {
            grid-template-columns: 1fr;
          }
          .success-actions {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Booking;