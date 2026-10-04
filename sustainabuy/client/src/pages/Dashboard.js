import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!user) {
      navigate("/login");
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/history");
      setHistory(res.data);
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Failed to load history.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setHistory(history.filter((h) => h._id !== id));
    } catch (err) {
      alert("Failed to remove item: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "40px auto", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: 16 }}>Loading your saved history...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "20px", background: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "var(--hunter-green)" }}>Your Saved History</h2>

      {error && (
        <p style={{ color: "white", background: "#d32f2f", padding: "10px 14px", borderRadius: 6, fontSize: 14 }}>
          ⚠️ {error}
        </p>
      )}

      {!error && history.length === 0 && (
        <p style={{ color: "var(--pine-teal)" }}>
          No products saved yet. <Link to="/search" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>Search for a product</Link> and save it from the detail page.
        </p>
      )}

      {history.map((h) => (
        <div
          key={h._id}
          style={{
            border: "1px solid var(--dry-sage)",
            padding: 15,
            marginBottom: 12,
            borderRadius: 6,
            background: "#fdfdfd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Link
              to={`/product/${h.product?._id}`}
              style={{ fontWeight: "bold", fontSize: "16px", color: "var(--hunter-green)", textDecoration: "none" }}
            >
              {h.product?.name || "Unknown Product"}
            </Link>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
              Viewed: {new Date(h.viewedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => handleRemove(h._id)}
            style={{
              padding: "6px 12px",
              background: "#d32f2f",
              color: "white",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              border: "none",
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;