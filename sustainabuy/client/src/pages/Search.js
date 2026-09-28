import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState({}); // track which products are saved
  const [filterGrade, setFilterGrade] = useState("all");
  const { user } = useAuth();

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

  const handleSaveToDashboard = async (productId) => {
    try {
      await api.post("/history", { productId });
      setSavedIds((prev) => ({ ...prev, [productId]: true }));
    } catch (err) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save product. Please try again.");
    }
  };
  
  const filteredResults = filterGrade === "all" 
    ? results 
    : results.filter(p => p.nutritionGrade && p.nutritionGrade.toLowerCase() === filterGrade);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <h2 style={{ color: "var(--hunter-green)" }}>Search Products</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search e.g. chocolate"
          style={{ padding: "10px", flex: 1, minWidth: "200px", maxWidth: "400px", borderRadius: "6px", border: "1px solid var(--dry-sage)", outline: "none" }}
        />
        <button type="submit" style={{ padding: "10px 20px", borderRadius: "6px", fontWeight: "bold" }}>Search</button>
      </form>

      {searched && !error && results.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px", color: "var(--pine-teal)", fontWeight: "bold" }}>Filter by Grade:</label>
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--dry-sage)" }}
          >
            <option value="all">All Grades</option>
            <option value="a">Grade A</option>
            <option value="b">Grade B</option>
            <option value="c">Grade C</option>
            <option value="d">Grade D</option>
            <option value="e">Grade E</option>
          </select>
        </div>
      )}

      {loading && <p style={{ color: "var(--pine-teal)" }}>Loading...</p>}
      {error && <p style={{ color: "white", background: "#d32f2f", padding: 10, borderRadius: 4 }}>⚠️ {error}</p>}

      {searched && filteredResults.length === 0 && !loading && !error && (
        <p style={{ color: "var(--pine-teal)" }}>
          {results.length === 0 ? `No products found for "${query}". Try a different keyword.` : `No products found containing Grade ${filterGrade.toUpperCase()}.`}
        </p>
      )}

      <div>
        {filteredResults.map((p) => (
          <div
            key={p._id}
            style={{
              border: "1px solid var(--dry-sage)",
              padding: 16,
              marginBottom: 12,
              borderRadius: 8,
              background: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <Link to={`/product/${p._id}`} style={{ fontSize: 18, fontWeight: "bold", color: "var(--fern)" }}>
                  {p.name}
                </Link>
              </div>

              {user && (
                <button
                  onClick={() => handleSaveToDashboard(p._id)}
                  disabled={savedIds[p._id]}
                  style={{
                    padding: "6px 14px",
                    marginLeft: 12,
                    background: savedIds[p._id] ? "var(--dry-sage)" : "var(--hunter-green)",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    cursor: savedIds[p._id] ? "default" : "pointer",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                  }}
                >
                  {savedIds[p._id] ? "✔ Saved" : "Save to Dashboard"}
                </button>
              )}
            </div>

            <div style={{ marginTop: 8, color: "var(--pine-teal)", fontSize: 14, lineHeight: 1.7 }}>
              <p style={{ margin: "2px 0" }}>
                <strong>Brand:</strong> {p.brands || "Unknown"} &nbsp;|&nbsp;
                <strong>Category:</strong> {p.categories || "Unknown"}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Packaging:</strong> {p.packaging || "Unknown"} &nbsp;|&nbsp;
                <strong>Grade:</strong>{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      p.nutritionGrade === "a"
                        ? "var(--hunter-green)"
                        : p.nutritionGrade === "b"
                        ? "var(--fern)"
                        : p.nutritionGrade === "c"
                        ? "#f9a825"
                        : p.nutritionGrade === "d"
                        ? "#ef6c00"
                        : p.nutritionGrade === "e"
                        ? "#c62828"
                        : "var(--dry-sage)",
                  }}
                >
                  {p.nutritionGrade?.toUpperCase() || "N/A"}
                </span>
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Nutrition Score:</strong> {p.nutritionScore ?? "N/A"} &nbsp;|&nbsp;
                <strong>Energy:</strong> {p.energy100g ?? 0} kcal/100g
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Fat:</strong> {p.fat100g ?? 0}g &nbsp;|&nbsp;
                <strong>Sugar:</strong> {p.sugars100g ?? 0}g &nbsp;|&nbsp;
                <strong>Protein:</strong> {p.proteins100g ?? 0}g &nbsp;|&nbsp;
                <strong>Sodium:</strong> {p.sodium100g ?? 0}g
              </p>
            </div>

            {!user && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--dry-sage)" }}>
                <Link to="/login" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>Login</Link> to save this product to your dashboard.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;