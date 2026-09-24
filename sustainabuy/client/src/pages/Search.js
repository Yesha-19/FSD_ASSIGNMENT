import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(false);
    try {
      const res = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(`Search failed: ${msg}`);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>Search Products</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search e.g. chocolate"
          style={{ padding: 8, width: 300 }}
        />
        <button type="submit" style={{ padding: 8, marginLeft: 8 }}>Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red", background: "#fff3f3", padding: 10, borderRadius: 4 }}>⚠️ {error}</p>}

      {searched && results.length === 0 && !error && (
        <p style={{ color: "#888" }}>No products found for "{query}". Try a different keyword.</p>
      )}

      <div>
        {results.map((p) => (
          <div key={p._id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 8, borderRadius: 6 }}>
            <Link to={`/product/${p._id}`}>
              <strong>{p.name}</strong>
            </Link>
            <p style={{ margin: "4px 0", color: "#666" }}>{p.brands} — Grade: {p.nutritionGrade?.toUpperCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;