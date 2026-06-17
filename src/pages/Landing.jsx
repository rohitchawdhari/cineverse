import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Landing({ user }) {
  const [movies, setMovies] = useState([]);
  const [cityMovies, setCityMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCity = localStorage.getItem("cineverse_city") || "Delhi";

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        // Fetch all movies
        const moviesRes = await fetch("http://localhost:8000/api/movies");
        if (moviesRes.ok) {
          const moviesData = await moviesRes.json();
          setMovies(moviesData);
        }

        // Fetch city-filtered movies
        const cityMoviesRes = await fetch(`http://localhost:8000/api/movies?city=${selectedCity}`);
        if (cityMoviesRes.ok) {
          const cityMoviesData = await cityMoviesRes.json();
          setCityMovies(cityMoviesData);
        }

        // Fetch theaters in city
        const theatersRes = await fetch(`http://localhost:8000/api/theaters?city=${selectedCity}`);
        if (theatersRes.ok) {
          const theatersData = await theatersRes.json();
          setTheaters(theatersData);
        }
      } catch (error) {
        console.error("Error fetching landing data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, [selectedCity]);

  // Now Showing in this city (fallback to general list if city has no movies scheduled yet)
  const today = new Date().toISOString().split("T")[0];
  const nowShowingBase = cityMovies.length > 0 
    ? cityMovies 
    : movies.filter(m => !m.releaseDate || m.releaseDate <= today);
  
  // Filter by search query
  const nowShowing = nowShowingBase.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Upcoming movies
  const upcoming = movies
    .filter(m => m.releaseDate && m.releaseDate > today)
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Recommended Movies (Rating >= 4.0)
  const recommended = movies
    .filter(m => {
      const r = getAverageRating(m);
      return parseFloat(r) >= 4.0;
    })
    .slice(0, 4);

  // Popular Movies (Sorted by reviews count)
  const popular = [...movies]
    .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
    .slice(0, 4);

  // Auto-advance hero banner slider
  useEffect(() => {
    if (nowShowing.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % Math.min(nowShowing.length, 3));
    }, 6000);
    return () => clearInterval(interval);
  }, [nowShowing]);

  const getAverageRating = (movie) => {
    if (!movie.reviews || movie.reviews.length === 0) return 4.5;
    const sum = movie.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / movie.reviews.length).toFixed(1);
  };

  const currentHeroMovie = nowShowing[activeSlide];

  return (
    <div className="landing-container animate-fade-in">
      <div className="landing-glow-1"></div>
      <div className="landing-glow-2"></div>

      {/* Hero Banner Slider */}
      {currentHeroMovie ? (
        <section 
          className="hero-section hero-banner-slider" 
          style={{ 
            backgroundImage: currentHeroMovie.banner 
              ? `linear-gradient(to top, var(--bg-dark) 5%, rgba(7, 5, 18, 0.4) 50%, rgba(7, 5, 18, 0.7) 100%), url(${currentHeroMovie.banner})`
              : "linear-gradient(to top, var(--bg-dark), rgba(159, 43, 255, 0.15))"
          }}
        >
          <div className="hero-content text-left">
            <span className="hero-badge">Now Showing in {selectedCity}</span>
            <h1>{currentHeroMovie.title}</h1>
            <p className="hero-description">{currentHeroMovie.description}</p>
            <div className="hero-meta-row">
              <span className="hero-meta-item">★ {getAverageRating(currentHeroMovie)}</span>
              <span className="hero-meta-item">{currentHeroMovie.genre}</span>
              <span className="hero-meta-item">{currentHeroMovie.duration} mins</span>
            </div>
            <div className="hero-buttons">
              <Link to={user ? "/booking" : "/login"} state={{ movieTitle: currentHeroMovie.title }} className="btn btn-primary btn-lg">
                Book Tickets Now
              </Link>
              <Link to="/movies" className="btn btn-secondary btn-lg">
                Explore All Movies
              </Link>
            </div>
          </div>
          
          <div className="slider-dots">
            {nowShowing.slice(0, 3).map((_, idx) => (
              <span 
                key={idx} 
                className={`slider-dot ${activeSlide === idx ? "active" : ""}`}
                onClick={() => setActiveSlide(idx)}
              ></span>
            ))}
          </div>
        </section>
      ) : (
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-badge">Welcome to Cineverse</span>
            <h1>Step Into the Next Era of Cinema</h1>
            <p>
              Experience movies like never before. Browse catalogs, check real-time showtimes in {selectedCity}, 
              and reserve your favorite seats instantly with Cineverse's premium booking engine.
            </p>
            <div className="hero-buttons">
              <Link to={user ? "/movies" : "/login"} className="btn btn-primary btn-lg">
                Book Tickets Now
              </Link>
              <Link to="/movies" className="btn btn-secondary btn-lg">
                Explore Catalog
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Global Interactive Search Panel */}
      <section className="search-section" style={{ maxWidth: "1200px", margin: "-40px auto 40px", padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-panel search-bar-container" style={{ display: "flex", gap: "12px", padding: "16px 24px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <span style={{ fontSize: "1.4rem", alignSelf: "center" }}>🔍</span>
          <input
            type="text"
            className="form-input"
            style={{ border: "none", background: "transparent", fontSize: "1.05rem", padding: "8px 0", flex: 1 }}
            placeholder={`Search recommended and upcoming movies in ${selectedCity}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="showcase-section">
        <div className="section-title-container">
          <div>
            <h2>Now Showing in {selectedCity}</h2>
            <p>Curated blockbusters playing near you.</p>
          </div>
          <Link to="/movies" className="view-all-link">View All Movies →</Link>
        </div>
        
        {loading ? (
          <div className="loading-placeholder">Loading showing movies...</div>
        ) : nowShowing.length > 0 ? (
          <div className="showcase-grid">
            {nowShowing.map((movie) => (
              <div key={movie.id} className="glass-panel showcase-card">
                <div className="showcase-poster-wrapper">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="showcase-poster-img" />
                  ) : (
                    <div className="showcase-poster-fallback">🎬</div>
                  )}
                  <div className="showcase-badge">NOW SHOWING</div>
                </div>
                <div className="showcase-info">
                  <div>
                    <span className="showcase-genre">{movie.genre}</span>
                    <h3>{movie.title}</h3>
                  </div>
                  <div className="showcase-footer">
                    <span className="movie-rating">★ {getAverageRating(movie)}</span>
                    <Link to={user ? "/booking" : "/login"} state={{ movieTitle: movie.title }} className="showcase-btn">
                      Book Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-movies-placeholder">No showing movies found matching your search.</div>
        )}
      </section>

      {/* Recommended Movies Section */}
      {recommended.length > 0 && !searchQuery && (
        <section className="showcase-section">
          <div className="section-title-container">
            <div>
              <h2>Recommended Blockbusters</h2>
              <p>Top-rated selections for movie enthusiasts.</p>
            </div>
          </div>
          <div className="showcase-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {recommended.map((movie) => (
              <div key={movie.id} className="glass-panel showcase-card" style={{ borderColor: "rgba(0, 242, 254, 0.15)" }}>
                <div className="showcase-poster-wrapper">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="showcase-poster-img" />
                  ) : (
                    <div className="showcase-poster-fallback">🎬</div>
                  )}
                  <div className="showcase-badge" style={{ background: "var(--secondary)" }}>HIGHLY RATED</div>
                </div>
                <div className="showcase-info">
                  <div>
                    <span className="showcase-genre" style={{ color: "var(--secondary)" }}>{movie.genre}</span>
                    <h3>{movie.title}</h3>
                  </div>
                  <div className="showcase-footer">
                    <span className="movie-rating" style={{ color: "var(--secondary)" }}>★ {getAverageRating(movie)}</span>
                    <Link to={user ? "/booking" : "/login"} state={{ movieTitle: movie.title }} className="showcase-btn" style={{ background: "rgba(0, 242, 254, 0.1)", color: "var(--secondary)", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
                      Book Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      <section className="showcase-section">
        <div className="section-title-container">
          <div>
            <h2>Upcoming Attractions</h2>
            <p>Get ready for these highly anticipated releases.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-placeholder">Loading upcoming movies...</div>
        ) : upcoming.length > 0 ? (
          <div className="showcase-grid">
            {upcoming.map((movie) => (
              <div key={movie.id} className="glass-panel showcase-card upcoming">
                <div className="showcase-poster-wrapper">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="showcase-poster-img" />
                  ) : (
                    <div className="showcase-poster-fallback">🎬</div>
                  )}
                  <div className="showcase-badge upcoming">UPCOMING</div>
                </div>
                <div className="showcase-info">
                  <div>
                    <span className="showcase-genre">{movie.genre}</span>
                    <h3>{movie.title}</h3>
                    <p className="release-date-text">Releasing on: {movie.releaseDate}</p>
                  </div>
                  <div className="showcase-footer">
                    <span className="movie-rating">★ {getAverageRating(movie)}</span>
                    <span className="upcoming-btn-placeholder">Coming Soon</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-movies-placeholder">No upcoming releases found matching your search.</div>
        )}
      </section>

      {/* Featured Theaters Multiplexes Section */}
      <section className="showcase-section">
        <div className="section-title-container">
          <div>
            <h2>Featured Multiplexes in {selectedCity}</h2>
            <p>Premium screen theaters available locally.</p>
          </div>
        </div>
        {loading ? (
          <div className="loading-placeholder">Loading theaters...</div>
        ) : theaters.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {theaters.map((t) => (
              <div key={t.id} className="glass-panel feature-card" style={{ textAlign: "left", padding: "24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>🏢</div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", fontWeight: "600", color: "var(--text-white)" }}>{t.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: "1.4", marginBottom: "16px" }}>{t.address}, {t.city}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "auto" }}>
                  <span style={{ fontSize: "0.75rem", background: "rgba(159, 43, 255, 0.15)", color: "#d8b4fe", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>
                    {t.screens?.length || 0} Dynamic Screens
                  </span>
                  <Link to={user ? "/booking" : "/login"} className="btn-link" style={{ fontSize: "0.85rem", textDecoration: "none", color: "var(--secondary)" }}>
                    View Shows →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-movies-placeholder">No premium theaters listed in {selectedCity} yet.</div>
        )}
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-title">
          <h2>Why Choose Cineverse</h2>
          <p>We deliver an unparalleled theatrical experience from booking to screen.</p>
        </div>
        <div className="features-grid">
          <div className="glass-panel feature-card">
            <span className="feature-icon">🔊</span>
            <h3>IMAX Sound & Vision</h3>
            <p>Experience movies in the ultimate visual and audio fidelity.</p>
          </div>
          <div className="glass-panel feature-card">
            <span className="feature-icon">🎟️</span>
            <h3>Interactive Seating</h3>
            <p>Select your favorite seats in real-time with our visual seat layout mapping.</p>
          </div>
          <div className="glass-panel feature-card">
            <span className="feature-icon">🍿</span>
            <h3>Premium Concessions</h3>
            <p>Explore food and drinks available to enhance your movie watching experience.</p>
          </div>
          <div className="glass-panel feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Instant Bookings</h3>
            <p>Fast checkout with QR tickets and PDF receipts sent straight to your email.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>© 2026 Cineverse Multiplex. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-container {
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .landing-glow-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(159, 43, 255, 0.12), transparent 70%);
          top: -200px;
          right: -100px;
          z-index: -1;
        }

        .landing-glow-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 242, 254, 0.08), transparent 70%);
          bottom: 200px;
          left: -200px;
          z-index: -1;
        }

        .hero-section {
          max-width: 100%;
          padding: 120px 20px 80px;
          text-align: center;
          position: relative;
          background-size: cover;
          background-position: center;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-image 0.8s ease-in-out;
        }

        .hero-banner-slider {
          justify-content: flex-start;
          text-align: left;
          padding-left: calc((100vw - 1200px) / 2 + 20px);
        }

        .hero-content {
          max-width: 650px;
          z-index: 5;
        }

        .hero-description {
          font-size: 1.1rem;
          margin-bottom: 24px;
          color: var(--text-muted);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-meta-row {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          align-items: center;
        }

        .hero-meta-item {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .hero-badge {
          background: rgba(159, 43, 255, 0.2);
          border: 1px solid rgba(159, 43, 255, 0.4);
          color: #d8b4fe;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 24px;
        }

        .hero-content h1 {
          font-size: 3.5rem;
          line-height: 1.15;
          margin-bottom: 20px;
          color: var(--text-white);
          text-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
        }

        .slider-dots {
          position: absolute;
          bottom: 30px;
          right: 40px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .slider-dot {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
        }

        .slider-dot.active {
          background: var(--primary);
          width: 30px;
          border-radius: 5px;
          box-shadow: var(--shadow-neon);
        }

        .section-title-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 36px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .view-all-link {
          color: var(--primary-hover);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: transform 0.3s;
        }

        .view-all-link:hover {
          transform: translateX(5px);
          color: var(--secondary);
        }

        /* Showcase grid */
        .showcase-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          text-align: left;
        }

        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        .showcase-card {
          padding: 0;
          text-align: left;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
        }

        .showcase-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: var(--shadow-neon);
        }

        .showcase-poster-wrapper {
          position: relative;
          height: 320px;
          width: 100%;
          background: #0f0b21;
          overflow: hidden;
        }

        .showcase-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .showcase-card:hover .showcase-poster-img {
          transform: scale(1.08);
        }

        .showcase-poster-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .showcase-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--primary);
          color: var(--text-white);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          z-index: 10;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        }

        .showcase-badge.upcoming {
          background: #d97706; /* Orange */
        }

        .showcase-info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .showcase-genre {
          font-size: 0.75rem;
          color: var(--secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-block;
          margin-bottom: 6px;
        }

        .showcase-card h3 {
          font-size: 1.15rem;
          margin-bottom: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .release-date-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .showcase-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
          margin-top: auto;
        }

        .upcoming-btn-placeholder {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .loading-placeholder, .no-movies-placeholder {
          text-align: center;
          padding: 60px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          color: var(--text-muted);
        }

        /* Features Section */
        .features-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .feature-card {
          padding: 36px 28px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 2.5rem;
          display: inline-block;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid var(--border-color);
          background: rgba(7, 5, 18, 0.9);
          padding: 40px 20px;
          margin-top: 60px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .footer-links {
          display: flex;
          gap: 20px;
        }

        .footer-links a {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-links a:hover {
          color: var(--text-white);
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 80px 20px 40px;
            min-height: 400px;
          }
          .hero-banner-slider {
            padding-left: 20px;
          }
          .hero-content h1 {
            font-size: 2.5rem;
          }
          .hero-buttons {
            flex-direction: column;
            gap: 12px;
          }
          .footer-content {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Landing;
