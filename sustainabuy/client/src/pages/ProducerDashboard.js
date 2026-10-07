import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STAR_COLORS = ["#ef5350", "#ff7043", "#ffa726", "#66bb6a", "#26a69a"];
const GRADE_COLOR = { a: "#2e7d32", b: "#558b2f", c: "#f9a825", d: "#e65100", e: "#c62828" };

function gradeColor(g) { return GRADE_COLOR[g?.toLowerCase()] || "#90a4ae"; }

/* ── Stars display (read-only) ── */
function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? "#f9a825" : "#ccc", fontSize: "16px" }}>★</span>
      ))}
    </span>
  );
}

/* ── Analytics Charts ── */
function ProducerAnalytics() {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    api.get("/reviews/analytics")
      .then((res) => setState({ loading: false, error: "", data: res.data }))
      .catch((err) => setState({ loading: false, error: err.response?.data?.message || "Failed to load analytics.", data: null }));
  }, []);

  const box = {
    background: "white", borderRadius: 12, padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e0e9ff",
  };

  if (state.loading) return <div style={box}><p style={{ color: "#999" }}>Loading analytics…</p></div>;
  if (state.error)   return <div style={box}><p style={{ color: "#c62828", fontSize: 14 }}>⚠️ {state.error}</p></div>;

  const { analytics, overallRatingDist } = state.data;

  if (!analytics || analytics.length === 0) return (
    <div style={{ ...box, textAlign: "center", padding: "40px" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📊</div>
      <p style={{ color: "#888", fontSize: 15 }}>
        Add products and collect customer reviews to see analytics.
      </p>
    </div>
  );

  const barData = analytics.map((a) => ({
    name: a.productName.length > 18 ? a.productName.substring(0, 16) + "…" : a.productName,
    "Avg Rating": a.avgRating || 0,
    Reviews: a.totalReviews,
  }));

  const pieData = [1, 2, 3, 4, 5].map((s) => ({
    name: `${s}★`,
    value: overallRatingDist[s] || 0,
  })).filter((d) => d.value > 0);

  // Summary stats
  const totalReviews = analytics.reduce((sum, a) => sum + a.totalReviews, 0);
  const avgAll = totalReviews > 0
    ? (analytics.reduce((sum, a) => sum + (a.avgRating || 0) * a.totalReviews, 0) / totalReviews).toFixed(1)
    : "—";

  return (
    <div style={box}>
      <h3 style={{ color: "#1565c0", margin: "0 0 20px", fontSize: 18 }}>📊 Analytics Overview</h3>

      {/* Summary stat cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        {[
          { label: "My Products", value: analytics.length, color: "#1565c0" },
          { label: "Total Reviews", value: totalReviews, color: "#2e7d32" },
          { label: "Overall Avg Rating", value: totalReviews > 0 ? `${avgAll} ★` : "—", color: "#f9a825" },
        ].map((c) => (
          <div key={c.label} style={{
            flex: "1 1 120px", background: "#f8faff", borderRadius: 10, padding: "14px 18px",
            textAlign: "center", border: "1px solid #e0e9ff",
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: "bold", color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart — avg rating per product */}
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1565c0", margin: "0 0 10px" }}>
        Average Rating per Product
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={barData} margin={{ top: 4, right: 16, left: -10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} angle={-20} textAnchor="end" tickLine={false} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v, n) => [n === "Avg Rating" ? `${v}/5` : v, n]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Bar dataKey="Avg Rating" fill="#1e88e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Pie Chart — overall rating distribution */}
      {pieData.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1565c0", margin: "24px 0 10px" }}>
            Overall Rating Distribution
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => <Cell key={i} fill={STAR_COLORS[i % STAR_COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v) => [`${v} review${v !== 1 ? "s" : ""}`]} />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

/* ── My Products List ── */
function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/mine");
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your products.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id,name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const box = {
    background: "white", borderRadius: 12, padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e0f2f1",
  };

  if (loading) return <div style={box}><p style={{ color: "#999" }}>Loading your products…</p></div>;
  if (error)   return <div style={box}><p style={{ color: "#c62828", fontSize: 14 }}>⚠️ {error}</p></div>;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ color: "#00695c", margin: 0, fontSize: 18 }}>📦 My Products</h3>
        <Link to="/add-product" style={{
          background: "linear-gradient(90deg,#00897b,#26a69a)", color: "white",
          textDecoration: "none", padding: "8px 16px", borderRadius: "8px",
          fontSize: "13px", fontWeight: 700,
        }}>+ Add Product</Link>
      </div>

      {products.length === 0 && (
        <p style={{ color: "#888", fontSize: 14 }}>
          You haven't added any products yet.{" "}
          <Link to="/add-product" style={{ color: "#00695c", fontWeight: 700 }}>Add your first product →</Link>
        </p>
      )}

      {products.map((p) => (
        <div key={p._id} style={{
          border: "1px solid #e0f2f1", padding: "14px 16px", marginBottom: 12,
          borderRadius: 10, background: "#f9fffe",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ flex: 1 }}>
            <Link to={`/product/${p._id}`} style={{ fontWeight: 700, fontSize: 15, color: "#00695c", textDecoration: "none" }}>
              {p.name}
            </Link>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
              {p.brands} · Grade:{" "}
              <span style={{ fontWeight: 700, color: gradeColor(p.nutritionGrade) }}>
                {p.nutritionGrade?.toUpperCase() || "N/A"}
              </span>
              {" "}· Health: <span style={{ fontWeight: 700 }}>{p.healthScore ?? "N/A"}/100</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <Link to={`/product/${p._id}`} style={{
              padding: "6px 12px", background: "#e0f2f1", color: "#00695c",
              borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none",
            }}>View / Edit</Link>
            <button
              onClick={() => handleDelete(p._id, p.name)}
              style={{
                padding: "6px 12px", background: "#d32f2f", color: "white",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Customer Reviews Section ── */
function CustomerReviews() {
  const [state, setState] = useState({ loading: true, error: "", reviews: [], products: [] });

  useEffect(() => {
    api.get("/reviews/my-products")
      .then((res) => setState({ loading: false, error: "", reviews: res.data.reviews, products: res.data.products }))
      .catch((err) => setState({ loading: false, error: err.response?.data?.message || "Failed to load reviews.", reviews: [], products: [] }));
  }, []);

  const box = {
    background: "white", borderRadius: 12, padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #fce4ec",
  };

  if (state.loading) return <div style={box}><p style={{ color: "#999" }}>Loading reviews…</p></div>;
  if (state.error)   return <div style={box}><p style={{ color: "#c62828", fontSize: 14 }}>⚠️ {state.error}</p></div>;

  return (
    <div style={box}>
      <h3 style={{ color: "#c62828", margin: "0 0 18px", fontSize: 18 }}>⭐ Customer Reviews</h3>

      {state.reviews.length === 0 && (
        <p style={{ color: "#888", fontSize: 14 }}>
          No customer reviews yet. Reviews will appear here once customers rate your products.
        </p>
      )}

      {state.reviews.map((r) => (
        <div key={r._id} style={{
          border: "1px solid #fce4ec", padding: "14px 16px", marginBottom: 12,
          borderRadius: 10, background: "#fff9fa",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <Stars rating={r.rating} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>
                  {r.user?.name || "Anonymous"}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666", fontStyle: r.comment ? "normal" : "italic" }}>
                {r.comment || "No comment"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#aaa" }}>
                Product: <strong style={{ color: "#555" }}>{r.product?.name}</strong>
                {" · "}
                {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div style={{
              background: "#f9a825", color: "white", borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0,
            }}>
              {r.rating}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Producer Dashboard Page ── */
function ProducerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "producer" && user.role !== "admin") { navigate("/dashboard"); }
  }, [user, navigate]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px 60px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d47a1, #1565c0, #1e88e5)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 28, color: "white",
        boxShadow: "0 8px 24px rgba(13,71,161,0.3)",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800 }}>🚀 Producer Hub</h2>
        <p style={{ margin: "0 0 18px", opacity: 0.8, fontSize: 15 }}>
          Welcome, <strong>{user?.name}</strong> — manage your products, reviews & analytics.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/search" style={{
            background: "rgba(255,255,255,0.18)", color: "white", textDecoration: "none",
            padding: "8px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
          }}>🔍 Search</Link>
          <Link to="/add-product" style={{
            background: "rgba(255,255,255,0.18)", color: "white", textDecoration: "none",
            padding: "8px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
          }}>➕ Add Product</Link>
        </div>
      </div>

      {/* Layout: two-column on wide, single on narrow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <MyProducts />
          <CustomerReviews />
        </div>
        {/* Right column */}
        <div>
          <ProducerAnalytics />
        </div>
      </div>
    </div>
  );
}

export default ProducerDashboard;
