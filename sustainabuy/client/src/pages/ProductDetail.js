import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── Helpers ── */
function scoreColor(s) {
  if (s === null || s === undefined) return "#90a4ae";
  if (s >= 70) return "#2e7d32";
  if (s >= 50) return "#558b2f";
  if (s >= 35) return "#f9a825";
  return "#c62828";
}

const GRADE_BG = { a: "#2e7d32", b: "#558b2f", c: "#f9a825", d: "#ef6c00", e: "#c62828" };

/* ── Healthier Alternatives ── */
function HealthierAlternatives({ productId }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    if (!productId) return;
    setState({ loading: true, error: "", data: null });
    api.get(`/products/${productId}/alternatives`)
      .then((res) => setState({ loading: false, error: "", data: res.data }))
      .catch((err) => setState({
        loading: false,
        error: !err.response ? "Cannot reach the server." : (err.response?.data?.message || "Failed to load alternatives."),
        data: null,
      }));
  }, [productId]);

  const box = {
    background: "white", borderRadius: 10, padding: 20, marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #c8e6c9",
  };

  if (state.loading) return <div style={box}><h3 style={{ color: "#2e7d32", margin: "0 0 10px" }}>🌿 Healthier Alternatives</h3><p style={{ color: "#999" }}>Finding alternatives…</p></div>;
  if (state.error)   return <div style={box}><h3 style={{ color: "#2e7d32", margin: "0 0 10px" }}>🌿 Healthier Alternatives</h3><p style={{ color: "#c62828", fontSize: 14 }}>⚠️ {state.error}</p></div>;

  const { data } = state;
  if (data.currentScore === null) return (
    <div style={box}>
      <h3 style={{ color: "#2e7d32", margin: "0 0 10px" }}>🌿 Healthier Alternatives</h3>
      <p style={{ color: "#888", fontSize: 14 }}>{data.note || "No score available — cannot recommend alternatives."}</p>
    </div>
  );
  if (data.alternatives.length === 0) return (
    <div style={box}>
      <h3 style={{ color: "#2e7d32", margin: "0 0 6px" }}>🌿 Healthier Alternatives</h3>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{data.scoreLabel}</p>
      <p style={{ fontSize: 14, color: "#666" }}>No healthier products found in the same category.</p>
    </div>
  );

  return (
    <div style={box}>
      <h3 style={{ color: "#2e7d32", margin: "0 0 6px" }}>🌿 Healthier Alternatives</h3>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
        {data.scoreLabel} — same category, higher nutrition score than this product ({data.currentScore}/100).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.alternatives.map((alt) => (
          <Link key={alt._id} to={`/product/${alt._id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #dcedc8", borderRadius: 8, padding: "12px 16px",
              background: "#f9fdf6", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f8e9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f9fdf6"}
            >
              <div>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: 15, color: "#2e7d32" }}>{alt.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{alt.brands !== "Unknown" ? alt.brands : ""}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: "bold", color: scoreColor(alt.healthScore) }}>{alt.healthScore}</div>
                <div style={{ fontSize: 11, color: "#66bb6a", fontWeight: 600 }}>+{alt.scoreDifference} pts</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Customer Rating Section ── */
function CustomerRatingSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [hovered, setHovered] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/reviews/product/${productId}`)
      .then((res) => {
        setReviews(res.data);
        if (user) {
          const myRev = res.data.find(r => String(r.user?._id) === String(user.id) || String(r.user) === String(user.id));
          if (myRev) {
            setMyRating(myRev.rating);
            setComment(myRev.comment || "");
            setDone(true);
          }
        }
      })
      .catch(() => {});
  }, [productId, user]);

  const submitRating = async () => {
    if (!myRating) return;
    setSaving(true);
    try {
      await api.post("/reviews", { productId, rating: myRating, comment });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save rating.");
    }
    setSaving(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const box = {
    background: "white", borderRadius: 10, padding: 20, marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #fff8e1",
  };

  return (
    <div style={box}>
      <h3 style={{ color: "#f57c00", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        ⭐ Customer Reviews
        {avgRating && (
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f9a825" }}>
            {avgRating}/5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </span>
        )}
      </h3>

      {/* Submit rating — only for logged-in customers */}
      {user && user.role !== "producer" && user.role !== "admin" && !done && (
        <div style={{ marginBottom: 16, padding: "14px 16px", background: "#fffde7", borderRadius: 8, border: "1px solid #ffe082" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#795548" }}>Rate this product:</p>
          <div style={{ display: "flex", gap: "4px", marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s}
                onClick={() => setMyRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                style={{ fontSize: 28, cursor: "pointer", color: (hovered || myRating) >= s ? "#f9a825" : "#ddd", transition: "color 0.1s" }}
              >★</span>
            ))}
            {myRating > 0 && <span style={{ fontSize: 13, color: "#888", alignSelf: "center", marginLeft: 6 }}>{myRating}/5</span>}
          </div>
          <textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 6, boxSizing: "border-box",
              border: "1px solid #ffe082", background: "white", fontSize: 13, resize: "vertical",
            }}
          />
          <button
            onClick={submitRating}
            disabled={!myRating || saving}
            style={{
              marginTop: 10, padding: "8px 20px", borderRadius: 6, border: "none",
              background: myRating ? "#f57c00" : "#ccc", color: "white",
              fontWeight: 700, cursor: myRating ? "pointer" : "not-allowed", fontSize: 13,
            }}
          >
            {saving ? "Saving…" : "Submit Rating"}
          </button>
        </div>
      )}

      {done && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(76,175,80,0.1)", borderRadius: 8, color: "#2e7d32", fontSize: 13 }}>
          ✅ Thank you for your rating!
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>No reviews yet. Be the first to rate!</p>}
      {reviews.map((r) => (
        <div key={r._id} style={{
          padding: "12px 14px", marginBottom: 10, borderRadius: 8,
          background: "#fafafa", border: "1px solid #f5f5f5",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map((s) => (
                <span key={s} style={{ color: s <= r.rating ? "#f9a825" : "#ddd", fontSize: "16px" }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#aaa" }}>
              {r.user?.name} · {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          {r.comment && <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

/* ── Producer Edit Form ── */
function ProducerEditForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: product.name || "",
    brands: product.brands || "",
    categories: product.categories || "",
    packaging: product.packaging || "",
    ingredientCount: product.ingredientCount ?? 0,
    energy100g: product.energy100g ?? 0,
    fat100g: product.fat100g ?? 0,
    sugars100g: product.sugars100g ?? 0,
    proteins100g: product.proteins100g ?? 0,
    sodium100g: product.sodium100g ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const field = (label, key, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 6,
          border: "1px solid #ddd", boxSizing: "border-box", fontSize: 14,
        }}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/products/${product._id}`, form);
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    }
    setSaving(false);
  };

  return (
    <div style={{
      background: "#f8faff", borderRadius: 10, padding: 22, marginBottom: 20,
      border: "2px solid #1e88e5",
    }}>
      <h3 style={{ color: "#1565c0", margin: "0 0 18px" }}>✏️ Edit Product</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {field("Product Name", "name")}
        {field("Brand", "brands")}
        {field("Category", "categories")}
        {field("Packaging", "packaging")}
        {field("Ingredient Count", "ingredientCount", "number")}
        {field("Energy (kcal/100g)", "energy100g", "number")}
        {field("Fat (g/100g)", "fat100g", "number")}
        {field("Sugars (g/100g)", "sugars100g", "number")}
        {field("Proteins (g/100g)", "proteins100g", "number")}
        {field("Sodium (g/100g)", "sodium100g", "number")}
      </div>
      {error && <p style={{ color: "#c62828", fontSize: 13, marginTop: 0 }}>⚠️ {error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 24px", background: "#1565c0", color: "white",
            border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 14,
          }}
        >{saving ? "Saving…" : "Save Changes"}</button>
        <button
          onClick={onCancel}
          style={{
            padding: "10px 20px", background: "#eee", color: "#555",
            border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

/* ── Product Detail Page ── */
function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true); setError(""); setSaved(false); setEditing(false);
    api.get(`/products/${id}/score`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => {
        if (!err.response) setError("Cannot reach the server. Make sure the backend is running on port 5000.");
        else if (err.response.status === 404) setError("Product not found.");
        else setError(err.response?.data?.message || "Failed to load product details.");
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

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${data.product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      navigate("/producer-dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleEditSave = (updated) => {
    setData((prev) => ({ ...prev, product: updated }));
    setEditing(false);
  };

  if (loading) return (
    <div style={{ maxWidth: 660, margin: "60px auto", textAlign: "center" }}>
      <p style={{ fontSize: 18, color: "#666" }}>Loading product details…</p>
    </div>
  );
  if (error) return (
    <div style={{ maxWidth: 660, margin: "60px auto", padding: "0 16px" }}>
      <p style={{ color: "red", background: "#fff3f3", padding: 16, borderRadius: 8, fontSize: 15 }}>⚠️ {error}</p>
      <Link to="/search" style={{ color: "#2e7d32" }}>← Back to Search</Link>
    </div>
  );
  if (!data?.product) return (
    <div style={{ maxWidth: 660, margin: "60px auto" }}>
      <p>No product data.</p>
      <Link to="/search" style={{ color: "#2e7d32" }}>← Back to Search</Link>
    </div>
  );

  const p = data.product;
  const isOwner = user && user.role === "producer" && String(p.addedBy) === String(user.id);

  return (
    <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 16px 40px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Link to="/search" style={{ color: "var(--hunter-green)", textDecoration: "none", fontSize: 14, fontWeight: "bold" }}>
        ← Back to Search
      </Link>

      {/* Header with title + producer actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12, marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, color: "var(--hunter-green)", fontSize: 26, flex: 1 }}>{p.name}</h2>
        {isOwner && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: "8px 18px", background: "#1565c0", color: "white",
                border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 13,
              }}
            >{editing ? "Cancel Edit" : "✏️ Edit"}</button>
            <button
              onClick={handleDelete}
              style={{
                padding: "8px 18px", background: "#c62828", color: "white",
                border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 13,
              }}
            >🗑 Delete</button>
          </div>
        )}
      </div>

      {/* Inline Edit Form */}
      {editing && isOwner && (
        <ProducerEditForm product={p} onSave={handleEditSave} onCancel={() => setEditing(false)} />
      )}

      {/* Product Info */}
      <div style={{ background: "white", borderRadius: 10, padding: 20, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e0e0e0" }}>
        <h3 style={{ margin: "0 0 14px", color: "var(--pine-teal)" }}>Product Information</h3>
        {[
          ["Brand", p.brands || "Unknown"],
          ["Category", p.categories || "Unknown"],
          ["Packaging", p.packaging || "Unknown"],
        ].map(([k, v]) => (
          <p key={k} style={{ margin: "6px 0", fontSize: 15 }}><strong>{k}:</strong> {v}</p>
        ))}
        <p style={{ margin: "6px 0", fontSize: 15 }}>
          <strong>Nutrition Grade:</strong>{" "}
          <span style={{
            fontWeight: "bold", padding: "2px 10px", borderRadius: 4, color: "white",
            background: GRADE_BG[p.nutritionGrade] || "#90a4ae",
          }}>
            {p.nutritionGrade?.toUpperCase() || "N/A"}
          </span>
        </p>
        <p style={{ margin: "6px 0", fontSize: 15 }}><strong>Nutrition Score:</strong> {p.nutritionScore ?? "N/A"}</p>
        {p.healthScore !== null && p.healthScore !== undefined && (
          <p style={{ margin: "6px 0", fontSize: 15 }}>
            <strong>Nutrition Health Score:</strong>{" "}
            <span style={{ fontWeight: "bold", color: scoreColor(p.healthScore) }}>{p.healthScore}/100</span>
            <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>(higher = healthier)</span>
          </p>
        )}
      </div>

      {/* Nutritional Values */}
      <div style={{ background: "white", borderRadius: 10, padding: 20, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e0e0e0" }}>
        <h3 style={{ margin: "0 0 14px", color: "var(--pine-teal)" }}>Nutritional Values (per 100g)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
          {[
            ["Energy", `${p.energy100g ?? 0} kcal`],
            ["Fat", `${p.fat100g ?? 0} g`],
            ["Sugars", `${p.sugars100g ?? 0} g`],
            ["Proteins", `${p.proteins100g ?? 0} g`],
            ["Sodium", `${p.sodium100g ?? 0} g`],
            ["Ingredient Count", p.ingredientCount ?? 0],
          ].map(([k, v]) => (
            <p key={k} style={{ margin: "4px 0", fontSize: 14 }}><strong>{k}:</strong> {v}</p>
          ))}
        </div>
      </div>

      {/* Healthier alternatives */}
      <HealthierAlternatives productId={id} />

      {/* Customer rating section — shown to all; submission only to customers */}
      <CustomerRatingSection productId={id} />

      {/* Save to dashboard — for customers */}
      {user && user.role !== "producer" && user.role !== "admin" && (
        <button
          id="save-to-dashboard-btn"
          onClick={saveToHistory}
          disabled={saved}
          style={{
            padding: "12px 24px",
            background: saved ? "var(--dry-sage)" : "var(--hunter-green)",
            color: "white", border: "none", borderRadius: 8,
            cursor: saved ? "default" : "pointer",
            fontSize: 16, fontWeight: "bold", width: "100%",
          }}
        >
          {saved ? "✔ Saved to Dashboard" : "💾 Save to Dashboard"}
        </button>
      )}

      {!user && (
        <p style={{ color: "var(--dry-sage)", fontSize: 13, textAlign: "center", marginTop: 10 }}>
          <Link to="/login" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>Login</Link>{" "}
          to save this product to your dashboard.
        </p>
      )}
    </div>
  );
}

export default ProductDetail;