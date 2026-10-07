import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── helpers ── */
function scoreColor(s) {
  if (s === null || s === undefined) return "#90a4ae";
  if (s >= 70) return "#2e7d32";
  if (s >= 50) return "#558b2f";
  if (s >= 35) return "#f9a825";
  return "#c62828";
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ── Star Rating Widget ── */
function StarRating({ productId, currentRating }) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(currentRating || 0);
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(!!currentRating);

  useEffect(() => {
    if (currentRating) {
      setSelected(currentRating);
      setDone(true);
    }
  }, [currentRating]);

  const submit = async (rating) => {
    setSaving(true);
    try {
      await api.post("/reviews", { productId, rating });
      setSelected(rating);
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save rating");
    }
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
      <span style={{ fontSize: "12px", color: "#888", marginRight: "4px" }}>Rate:</span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => !saving && submit(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: "22px",
            cursor: saving ? "not-allowed" : "pointer",
            color: (hovered || selected) >= s ? "#f9a825" : "#ccc",
            transition: "color 0.1s",
            lineHeight: 1,
          }}
        >★</span>
      ))}
      {done && (
        <span style={{ fontSize: "12px", color: "#4caf50", marginLeft: "6px", fontWeight: 600 }}>
          Rated {selected}/5 ✓
        </span>
      )}
    </div>
  );
}

/* ── Greener Alternatives Mini-Panel ── */
function AlternativesPanel({ productId }) {
  const [alts, setAlts]     = useState(null);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (alts !== null) { setOpen(!open); return; }
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/alternatives?limit=3`);
      setAlts(res.data.alternatives || []);
      setOpen(true);
    } catch { setAlts([]); }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        onClick={load}
        style={{
          background: "none", border: "1px solid #4caf50", color: "#2e7d32",
          borderRadius: "6px", padding: "4px 10px", fontSize: "12px",
          cursor: "pointer", fontWeight: 600,
        }}
      >
        {loading ? "Loading…" : open ? "▲ Hide Greener Alternatives" : "🌱 Show Greener Alternatives"}
      </button>

      {open && (
        <div style={{ marginTop: "8px", paddingLeft: "8px", borderLeft: "3px solid #c8e6c9" }}>
          {alts && alts.length === 0 && (
            <p style={{ fontSize: "13px", color: "#888", margin: "4px 0" }}>
              No greener alternatives found in our dataset.
            </p>
          )}
          {alts && alts.map((a) => (
            <div key={a._id} style={{ marginBottom: "6px" }}>
              <Link to={`/product/${a._id}`} style={{ color: "#2e7d32", fontWeight: 600, fontSize: "13px" }}>
                {a.name}
              </Link>
              <span style={{ color: "#888", fontSize: "12px", marginLeft: "6px" }}>
                Health: <strong style={{ color: scoreColor(a.healthScore) }}>{a.healthScore}/100</strong>
                {" "}(+{a.scoreDifference} better)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Analytics Section ── */
function AnalyticsSection() {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    api.get("/history/analytics")
      .then((res) => setState({ loading: false, error: "", data: res.data }))
      .catch((err) => setState({ loading: false, error: err.response?.data?.message || "Failed to load analytics.", data: null }));
  }, []);

  const box = {
    background: "white", borderRadius: 12, padding: 24,
    marginBottom: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    border: "1px solid #c8e6c9",
  };

  if (state.loading) return <div style={box}><h3 style={{ color: "var(--hunter-green)", margin: "0 0 12px" }}>📊 My Analytics</h3><p style={{ color: "#999" }}>Loading…</p></div>;
  if (state.error)   return <div style={box}><h3 style={{ color: "var(--hunter-green)", margin: "0 0 12px" }}>📊 My Analytics</h3><p style={{ color: "#c62828", fontSize: 14 }}>⚠️ {state.error}</p></div>;

  const { data } = state;
  if (data.totalSaved === 0) return (
    <div style={box}>
      <h3 style={{ color: "var(--hunter-green)", margin: "0 0 8px" }}>📊 My Analytics</h3>
      <p style={{ color: "#888", fontSize: 14 }}>No saved products yet. Save products to see your analytics here.</p>
    </div>
  );

  const statCard = (label, value, sub, color) => (
    <div style={{
      flex: "1 1 140px", background: "white", borderRadius: 10, padding: "14px 18px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #dde8d9", textAlign: "center",
    }}>
      <p style={{ margin: 0, fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
      <p style={{ margin: "6px 0 2px", fontSize: 26, fontWeight: "bold", color: color || "var(--hunter-green)" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{sub}</p>}
    </div>
  );

  return (
    <div style={box}>
      <h3 style={{ color: "var(--hunter-green)", margin: "0 0 4px" }}>📊 My Analytics</h3>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 18px" }}>
        {data.scoreLabel} — computed from your saved product history.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {statCard("Total Saved", data.totalSaved)}
        {statCard("Avg Health Score", data.averageScore !== null ? `${data.averageScore}/100` : "—", "across scored products", data.averageScore !== null ? scoreColor(data.averageScore) : "#aaa")}
        {data.bestProduct  && statCard("Healthiest Saved",    `${data.bestProduct.scoreSnapshot}/100`,  data.bestProduct.name,  "#2e7d32")}
        {data.worstProduct && statCard("Least Healthy Saved", `${data.worstProduct.scoreSnapshot}/100`, data.worstProduct.name, "#c62828")}
      </div>

      {data.scoreOverTime.length >= 1 ? (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pine-teal)", margin: "0 0 10px" }}>
            Nutrition Health Score Over Time
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.scoreOverTime} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ede6" />
              <XAxis dataKey="viewedAt" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "#888" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v}/100`, "Health Score"]} labelFormatter={(l) => new Date(l).toLocaleDateString()} contentStyle={{ fontSize: 13, borderRadius: 6, border: "1px solid #c8e6c9" }} />
              <Line type="monotone" dataKey="scoreSnapshot" stroke="var(--hunter-green)" strokeWidth={2.5}
                dot={{ fill: "var(--fern)", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "var(--hunter-green)" }} />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p style={{ fontSize: 14, color: "#888" }}>Save some products to start tracking your nutrition health score over time.</p>
      )}
    </div>
  );
}

/* ── Main Dashboard ── */
function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchHistory();
  }, [user, navigate, fetchHistory]);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setHistory(history.filter((h) => h._id !== id));
    } catch (err) {
      alert("Failed to remove item: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 780, margin: "40px auto", padding: "20px", textAlign: "center" }}>
      <p style={{ color: "#666", fontSize: 16 }}>Loading your dashboard…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: "40px auto", padding: "0 16px 40px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a4731, #2e7d32)",
        borderRadius: 16, padding: "28px 30px", marginBottom: 28, color: "white",
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 24 }}>🛒 My Dashboard</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 15 }}>
          Hi <strong>{user?.name}</strong> — your saved products, ratings & health insights.
        </p>
        <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/search" style={{
            background: "rgba(255,255,255,0.2)", color: "white", textDecoration: "none",
            padding: "8px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
          }}>🔍 Search Products</Link>
        </div>
      </div>

      {/* Analytics */}
      <AnalyticsSection />

      {/* Saved Products */}
      <div style={{ background: "white", borderRadius: 12, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <h3 style={{ color: "var(--hunter-green)", margin: "0 0 18px", fontSize: 18 }}>
          📦 Saved Products
        </h3>

        {error && (
          <p style={{ color: "white", background: "#d32f2f", padding: "10px 14px", borderRadius: 6, fontSize: 14 }}>
            ⚠️ {error}
          </p>
        )}

        {!error && history.length === 0 && (
          <p style={{ color: "var(--pine-teal)" }}>
            No products saved yet.{" "}
            <Link to="/search" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>
              Search for a product
            </Link>{" "}
            and save it from the detail page.
          </p>
        )}

        {history.map((h) => (
          <div
            key={h._id}
            style={{
              border: "1px solid #e8ede6", padding: "16px 18px", marginBottom: 14,
              borderRadius: 10, background: "#fafef9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <Link
                  to={`/product/${h.product?._id}`}
                  style={{ fontWeight: "bold", fontSize: "16px", color: "var(--hunter-green)", textDecoration: "none" }}
                >
                  {h.product?.name || "Unknown Product"}
                </Link>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                  Saved: {new Date(h.viewedAt).toLocaleString()}
                  {h.scoreSnapshot !== null && h.scoreSnapshot !== undefined && (
                    <span style={{ marginLeft: 10, fontWeight: "bold", color: scoreColor(h.scoreSnapshot) }}>
                      Health Score: {h.scoreSnapshot}/100
                    </span>
                  )}
                </p>
                {/* Star rating */}
                {h.product?._id && (
                  <StarRating productId={h.product._id} currentRating={h.myRating} />
                )}
                {/* Greener alternatives */}
                {h.product?._id && <AlternativesPanel productId={h.product._id} />}
              </div>
              <button
                id={`remove-history-${h._id}`}
                onClick={() => handleRemove(h._id)}
                style={{
                  padding: "6px 12px", background: "#d32f2f", color: "white",
                  borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none",
                  marginLeft: 12, flexShrink: 0,
                }}
              >Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;