import { Link } from "react-router-dom";

function MovieCatalog() {
  const movies = [
    { id: 1, title: "KGF 2", rating: 8.5 },
    { id: 2, title: "Pushpa", rating: 8.2 },
    { id: 3, title: "Jawan", rating: 8.0 },
  ];

  return (
    <div>
      <h1>Movie Catalog Page</h1>

      {movies.map((movie) => (
        <div key={movie.id}>
          <h3>{movie.title}</h3>
          <p>Rating: {movie.rating}</p>
        </div>
      ))}

      <Link to="/booking">
        <button>Book Ticket</button>
      </Link>
    </div>
  );
}

export default MovieCatalog;