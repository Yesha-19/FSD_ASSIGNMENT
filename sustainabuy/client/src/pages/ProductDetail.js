import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/products/${id}/score`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!err.response) {
          setError("Cannot reach the server. Make sure the backend is running on port 5000.");
        } else if (err.response.status === 404) {
          setError("Product not found.");
        } else {
          setError(err.response?.data?.message || "Failed to load product details.");
        }
        setLoading(false);
      });
  }, [id]);

  const saveToHistory = async () => {
    try {
      await api.post("/history", { productId: id });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save. Make sure you are logged in.");
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "#666" }}>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
        <p style={{ color: "red", background: "#fff3f3", padding: 16, borderRadius: 8, fontSize: 15 }}>
          ⚠️ {error}
        </p>
        <Link to="/search" style={{ color: "#2e7d32" }}>← Back to Search</Link>
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto" }}>
        <p>No product data available.</p>
        <Link to="/search" style={{ color: "#2e7d32" }}>← Back to Search</Link>
      </div>
    );
  }

  const p = data.product;

  return (
    <div style={{ maxWidth: 650, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/search" style={{ color: "var(--hunter-green)", textDecoration: "none", fontSize: 14, fontWeight: "bold" }}>← Back to Search</Link>

      <h2 style={{ marginTop: 12, color: "var(--hunter-green)", fontSize: "28px" }}>{p.name}</h2>

      <div style={{ background: "white", borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid var(--dust-grey)" }}>
        <h3 style={{ margin: "0 0 12px", color: "var(--pine-teal)" }}>Product Information</h3>
        <p><strong>Brand:</strong> {p.brands || "Unknown"}</p>
        <p><strong>Category:</strong> {p.categories || "Unknown"}</p>
        <p><strong>Packaging:</strong> {p.packaging || "Unknown"}</p>
        <p>
          <strong>Nutrition Grade:</strong>{" "}
          <span
            style={{
              fontWeight: "bold",
              padding: "2px 10px",
              borderRadius: 4,
              color: "white",
              background:
                p.nutritionGrade === "a" ? "var(--hunter-green)"
                : p.nutritionGrade === "b" ? "var(--fern)"
                : p.nutritionGrade === "c" ? "#f9a825"
                : p.nutritionGrade === "d" ? "#ef6c00"
                : p.nutritionGrade === "e" ? "#c62828"
                : "var(--dry-sage)",
            }}
          >
            {p.nutritionGrade?.toUpperCase() || "N/A"}
          </span>
        </p>
        <p><strong>Nutrition Score (from dataset):</strong> {p.nutritionScore ?? "N/A"}</p>
      </div>

      <div style={{ background: "white", borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid var(--dust-grey)" }}>
        <h3 style={{ margin: "0 0 12px", color: "var(--pine-teal)" }}>Nutritional Values (per 100g)</h3>
        <p><strong>Energy:</strong> {p.energy100g ?? 0} kcal</p>
        <p><strong>Fat:</strong> {p.fat100g ?? 0} g</p>
        <p><strong>Sugars:</strong> {p.sugars100g ?? 0} g</p>
        <p><strong>Proteins:</strong> {p.proteins100g ?? 0} g</p>
        <p><strong>Sodium:</strong> {p.sodium100g ?? 0} g</p>
        <p><strong>Ingredient Count:</strong> {p.ingredientCount ?? 0}</p>
      </div>

      <div style={{ background: "white", borderRadius: 8, padding: 20, marginBottom: 20, textAlign: "center", border: "2px solid var(--fern)" }}>
        <h3 style={{ margin: "0 0 8px", color: "var(--hunter-green)" }}>AI Predicted Sustainability Score</h3>
        <p style={{ fontSize: 32, fontWeight: "bold", color: "var(--pine-teal)", margin: 0 }}>
          {data.predictedScore !== null && data.predictedScore !== undefined
            ? data.predictedScore
            : "AI service unavailable"}
        </p>
      </div>

      {user ? (
        <button
          onClick={saveToHistory}
          disabled={saved}
          style={{
            padding: "12px 24px",
            background: saved ? "var(--dry-sage)" : "var(--hunter-green)",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: saved ? "default" : "pointer",
            fontSize: 16,
            fontWeight: "bold",
            width: "100%"
          }}
        >
          {saved ? "✔ Saved to Dashboard" : "Save to Dashboard"}
        </button>
      ) : (
        <p style={{ color: "var(--dry-sage)", fontSize: 13, textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>Login</Link> to save this product to your dashboard.
        </p>
      )}
    </div>
  );
}

export default ProductDetail;