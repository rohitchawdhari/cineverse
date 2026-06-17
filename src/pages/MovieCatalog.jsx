import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

function MovieCatalog({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Selected Movie ID from router state
  const initialMovieId = location.state?.selectedMovieId || null;

  // Movie lists
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userWishlist, setUserWishlist] = useState([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Review Form States
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRatingInput, setEditRatingInput] = useState(5);
  const [editCommentInput, setEditCommentInput] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const selectedCity = localStorage.getItem("cineverse_city") || "Delhi";

  const fetchMoviesAndWishlist = async () => {
    try {
      setLoading(true);
      // Fetch all movies
      const moviesRes = await fetch("http://localhost:8000/api/movies");
      if (moviesRes.ok) {
        const data = await moviesRes.json();
        setMovies(data);
        
        // Handle initial selection if navigated from home page
        if (initialMovieId) {
          const matched = data.find(m => m.id === initialMovieId);
          if (matched) setSelectedMovie(matched);
        }
      }

      // Fetch user profile to get wishlist
      if (user && user.token) {
        const profileRes = await fetch("http://localhost:8000/api/auth/profile", {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserWishlist(profileData.wishlist || []);
        }
      }
    } catch (err) {
      console.error("Failed to load catalog data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoviesAndWishlist();
  }, [initialMovieId, user]);

  // Fetch shows of selected movie in selected city
  useEffect(() => {
    if (!selectedMovie) return;
    const fetchMovieShows = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/shows?movieId=${selectedMovie.id}&city=${selectedCity}`);
        if (response.ok) {
          const data = await response.json();
          setShows(data);
        }
      } catch (err) {
        console.error("Failed to fetch movie shows:", err);
      }
    };
    fetchMovieShows();
  }, [selectedMovie, selectedCity]);

  // Fetch a single movie update (to refresh reviews)
  const refreshSelectedMovie = async () => {
    if (!selectedMovie) return;
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${selectedMovie.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMovie(data);
        // Also update the movies list locally
        setMovies(prev => prev.map(m => m.id === data.id ? data : m));
      }
    } catch (err) {
      console.error("Error refreshing movie:", err);
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = async (movieId) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${movieId}/wishlist`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserWishlist(data.wishlist || []);
      }
    } catch (err) {
      console.error("Toggle wishlist failed:", err);
    }
  };

  // Add Review
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setReviewMessage("");
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${selectedMovie.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: ratingInput,
          comment: commentInput
        })
      });
      if (response.ok) {
        setCommentInput("");
        setRatingInput(5);
        refreshSelectedMovie();
        setReviewMessage("Review posted successfully!");
      } else {
        setReviewMessage("Failed to post review.");
      }
    } catch (err) {
      setReviewMessage("Network error.");
    }
  };

  // Edit Review
  const handleEditReview = async (reviewId) => {
    if (!editCommentInput.trim()) return;
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${selectedMovie.id}/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: editRatingInput,
          comment: editCommentInput
        })
      });
      if (response.ok) {
        setEditingReviewId(null);
        refreshSelectedMovie();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${selectedMovie.id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        refreshSelectedMovie();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Like Review
  const handleLikeReview = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${selectedMovie.id}/reviews/${reviewId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        refreshSelectedMovie();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group shows by theater
  const showsByTheater = shows.reduce((acc, show) => {
    if (!acc[show.theaterName]) {
      acc[show.theaterName] = [];
    }
    acc[show.theaterName].push(show);
    return acc;
  }, {});

  const getAverageRating = (movie) => {
    if (!movie.reviews || movie.reviews.length === 0) return 4.5;
    const sum = movie.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / movie.reviews.length).toFixed(1);
  };

  // Filter Catalog Movies
  const filteredMovies = movies.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.genre.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = !selectedGenre || m.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    const matchesLang = !selectedLanguage || m.language.toLowerCase() === selectedLanguage.toLowerCase();
    return matchesSearch && matchesGenre && matchesLang;
  });

  const getEmbedTrailerUrl = (url) => {
    if (!url) return "";
    // If it is a full watch link, convert to embed link
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    return url;
  };

  if (loading) {
    return <div className="container loading-placeholder">Loading movie catalog...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 20px" }}>
      
      {/* 1. MOVIE DETAILS VIEW */}
      {selectedMovie ? (
        <div className="movie-details-layout text-left animate-scale-up">
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginBottom: "24px" }}
            onClick={() => { setSelectedMovie(null); navigate("/movies", { state: null }); }}
          >
            ← Back to Catalog
          </button>

          <div className="movie-details-header glass-panel" style={{ padding: "32px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "32px", flexWrap: "wrap", marginBottom: "32px" }}>
            <div className="details-poster-wrapper" style={{ width: "220px", height: "330px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
              {selectedMovie.poster ? (
                <img src={selectedMovie.poster} alt={selectedMovie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", background: "#1a133d" }}>🎬</div>
              )}
              <button 
                onClick={() => handleToggleWishlist(selectedMovie.id)}
                style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: userWishlist.includes(selectedMovie.id) ? "#ef4444" : "#fff", transition: "all 0.3s" }}
                title="Add to Wishlist"
              >
                ♥
              </button>
            </div>

            <div className="details-info" style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span className="showcase-genre" style={{ fontSize: "0.85rem", color: "var(--secondary)" }}>{selectedMovie.genre}</span>
              <h1 style={{ fontSize: "2.5rem", fontWeight: "700", margin: 0 }}>{selectedMovie.title}</h1>
              
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="hero-meta-item">★ {getAverageRating(selectedMovie)} / 5</span>
                <span className="hero-meta-item">{selectedMovie.duration} mins</span>
                <span className="hero-meta-item" style={{ textTransform: "uppercase" }}>{selectedMovie.language}</span>
                <span className="hero-meta-item" style={{ background: "rgba(0,242,254,0.1)", color: "var(--secondary)", border: "1px solid rgba(0,242,254,0.3)" }}>{selectedMovie.rating}</span>
              </div>

              <div style={{ marginTop: "12px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>{selectedMovie.description}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Director</span>
                  <strong style={{ fontSize: "0.95rem" }}>{selectedMovie.director || "Not Specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starring Cast</span>
                  <strong style={{ fontSize: "0.95rem" }}>{selectedMovie.cast || "Not Specified"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Trailer & Showtimes Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px", marginBottom: "32px" }}>
            
            {/* Left Column: Trailer Embed */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px" }}>Official Trailer</h3>
              {selectedMovie.trailerUrl ? (
                <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, borderRadius: "8px", overflow: "hidden" }}>
                  <iframe
                    src={getEmbedTrailerUrl(selectedMovie.trailerUrl)}
                    title={`${selectedMovie.title} Trailer`}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.01)", height: "240px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
                  No trailer video available currently.
                </div>
              )}
            </div>

            {/* Right Column: Showtimes in Selected City */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Available Shows</h3>
                <span style={{ fontSize: "0.8rem", background: "rgba(0,242,254,0.1)", color: "var(--secondary)", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>{selectedCity}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "330px", overflowY: "auto" }}>
                {Object.keys(showsByTheater).length > 0 ? (
                  Object.keys(showsByTheater).map((theaterName) => (
                    <div key={theaterName} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "12px" }}>
                      <h4 style={{ fontSize: "1rem", margin: "0 0 10px 0", color: "#fff", fontWeight: "600" }}>{theaterName}</h4>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {showsByTheater[theaterName].map((show) => (
                          <Link
                            key={show.id}
                            to="/booking"
                            state={{ movieTitle: selectedMovie.title, showId: show.id }}
                            style={{ textDecoration: "none" }}
                          >
                            <button
                              className="time-pill"
                              style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "4px", minWidth: "60px" }}
                            >
                              {new Date(show.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                            </button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>
                    <span>📅</span>
                    <p style={{ margin: "10px 0 0 0", fontSize: "0.9rem" }}>No show schedules listed for {selectedCity} currently.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Reviews Section */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "12px", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "24px" }}>Audience Reviews</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "32px" }}>
              
              {/* Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", paddingRight: "12px" }}>
                {selectedMovie.reviews && selectedMovie.reviews.length > 0 ? (
                  selectedMovie.reviews.map((rev) => {
                    const isOwnReview = user && rev.username === user.name;
                    const hasLiked = user && rev.likedBy?.includes(user.name);

                    return (
                      <div key={rev.id || rev.username} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: "0.95rem", color: "var(--text-white)" }}>{rev.username}</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px" }}>{rev.timestamp}</span>
                          </div>
                          <span style={{ color: "var(--secondary)", fontWeight: "700", fontSize: "0.9rem" }}>★ {rev.rating}</span>
                        </div>

                        {editingReviewId === rev.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                            <select
                              className="form-input"
                              value={editRatingInput}
                              onChange={(e) => setEditRatingInput(parseFloat(e.target.value))}
                              style={{ width: "80px", padding: "4px" }}
                            >
                              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                            </select>
                            <textarea
                              className="form-input"
                              rows="2"
                              value={editCommentInput}
                              onChange={(e) => setEditCommentInput(e.target.value)}
                            ></textarea>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => handleEditReview(rev.id)} className="btn btn-primary btn-sm">Save</button>
                              <button onClick={() => setEditingReviewId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>{rev.comment}</p>
                            
                            <div style={{ display: "flex", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "10px", marginTop: "4px" }}>
                              <button 
                                onClick={() => handleLikeReview(rev.id)}
                                style={{ background: "none", border: "none", color: hasLiked ? "var(--secondary)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                              >
                                👍 {rev.likedBy?.length || 0} Likes
                              </button>
                              {isOwnReview && (
                                <>
                                  <button 
                                    onClick={() => { setEditingReviewId(rev.id); setEditRatingInput(rev.rating); setEditCommentInput(rev.comment); }}
                                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReview(rev.id)}
                                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    No reviews yet. Be the first to share your thoughts!
                  </div>
                )}
              </div>

              {/* Review Input form */}
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "32px" }}>
                <h4 style={{ fontSize: "1.1rem", margin: "0 0 16px 0", fontWeight: "600" }}>Write a Review</h4>
                <form onSubmit={handleAddReview} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label>Your Rating</label>
                    <select
                      className="form-input"
                      value={ratingInput}
                      onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                    >
                      <option value="5">5 Stars (Masterpiece)</option>
                      <option value="4">4 Stars (Great)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Terrible)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Review Comment</label>
                    <textarea
                      rows="4"
                      className="form-input"
                      placeholder="Share your thoughts about this movie..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  {reviewMessage && (
                    <div style={{ fontSize: "0.85rem", color: "var(--secondary)" }}>
                      {reviewMessage}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary">Submit Review</button>
                </form>
              </div>

            </div>
          </div>
        </div>
      ) : (
        
        /* 2. CATALOG BROWSE VIEW */
        <div className="catalog-browse-view animate-fade-in text-left">
          <div className="admin-header" style={{ marginBottom: "24px" }}>
            <h1>Browse Movies</h1>
            <p>Explore show blockbusters available across premium theater chains.</p>
          </div>

          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: "20px 24px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "32px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ width: "160px" }}>
              <select
                className="form-input"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{ background: "#0f0a1c", color: "#fff", cursor: "pointer" }}
              >
                <option value="">All Genres</option>
                <option value="Action">Action</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Drama">Drama</option>
                <option value="Comedy">Comedy</option>
                <option value="Horror">Horror</option>
                <option value="Romance">Romance</option>
                <option value="Thriller">Thriller</option>
                <option value="Adventure">Adventure</option>
              </select>
            </div>

            <div style={{ width: "160px" }}>
              <select
                className="form-input"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ background: "#0f0a1c", color: "#fff", cursor: "pointer" }}
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
              </select>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              style={{ height: "40px", padding: "0 16px" }}
              onClick={() => { setSearch(""); setSelectedGenre(""); setSelectedLanguage(""); }}
            >
              Reset Filters
            </button>
          </div>

          {/* Movies Grid */}
          {filteredMovies.length > 0 ? (
            <div className="showcase-grid">
              {filteredMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="glass-panel showcase-card"
                  onClick={() => setSelectedMovie(movie)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="showcase-poster-wrapper">
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} className="showcase-poster-img" />
                    ) : (
                      <div className="showcase-poster-fallback">🎬</div>
                    )}
                    <span 
                      onClick={(e) => { e.stopPropagation(); handleToggleWishlist(movie.id); }}
                      style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: userWishlist.includes(movie.id) ? "#ef4444" : "#fff", zIndex: 20 }}
                    >
                      ♥
                    </span>
                  </div>
                  <div className="showcase-info">
                    <div>
                      <span className="showcase-genre">{movie.genre}</span>
                      <h3>{movie.title}</h3>
                    </div>
                    <div className="showcase-footer">
                      <span className="movie-rating">★ {getAverageRating(movie)}</span>
                      <span className="showcase-btn" style={{ fontSize: "0.8rem" }}>View Details →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-movies-placeholder" style={{ padding: "80px 20px" }}>
              <span>🎬</span>
              <h3>No Movies Found</h3>
              <p>Try resetting filters or adjusting search parameters to browse other movies.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MovieCatalog;