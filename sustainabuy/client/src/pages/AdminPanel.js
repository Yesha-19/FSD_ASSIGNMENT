import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── Shared helpers ── */
const GRADE_COLORS = { a: "#2e7d32", b: "#558b2f", c: "#f9a825", d: "#ef6c00", e: "#c62828" };

function gradeColor(g) {
  return GRADE_COLORS[g?.toLowerCase()] || "#90a4ae";
}

const FIELD_DEFAULTS = {
  name: "", brands: "", categories: "", packaging: "",
  ingredientCount: 0, energy100g: 0, fat100g: 0,
  sugars100g: 0, proteins100g: 0, sodium100g: 0,
};

/* ── Styles (inline, matching existing site palette) ── */
const s = {
  page: { maxWidth: 1100, margin: "32px auto", padding: "0 16px" },
  tabs: { display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #c8d8c3" },
  tab: (active) => ({
    padding: "10px 24px", border: "none", borderRadius: "6px 6px 0 0",
    background: active ? "var(--hunter-green)" : "#e8ede6",
    color: active ? "white" : "var(--pine-teal)",
    fontWeight: "bold", fontSize: 14, cursor: "pointer", transition: "background 0.2s",
  }),
  card: {
    background: "white", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #dde8d9", overflow: "hidden",
  },
  toolbar: {
    display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
    padding: "14px 16px", borderBottom: "1px solid #eef2ec", background: "#f9fbf8",
  },
  searchInput: {
    flex: 1, minWidth: 180, padding: "8px 12px", border: "1px solid #c8d8c3",
    borderRadius: 6, fontSize: 14, outline: "none",
  },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 6, fontWeight: "bold", fontSize: 13,
    cursor: "pointer", border: "none",
    background: variant === "primary" ? "var(--hunter-green)"
      : variant === "danger" ? "#c62828"
      : variant === "secondary" ? "#546e57"
      : "#e0e0e0",
    color: variant === "ghost" ? "var(--pine-teal)" : "white",
    transition: "opacity 0.15s",
  }),
  th: {
    padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: "700",
    color: "var(--pine-teal)", background: "#f0f5ee", borderBottom: "1px solid #dde8d9",
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f0f5ee", verticalAlign: "middle" },
  tag: (color) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12,
    fontWeight: "bold", color: "white", background: color,
  }),
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "white", borderRadius: 10, padding: 28,
    width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  formRow: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--pine-teal)" },
  input: {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    border: "1px solid #c8d8c3", borderRadius: 6, fontSize: 14, outline: "none",
  },
  error: {
    background: "#fff3f3", border: "1px solid #ffcdd2", color: "#c62828",
    padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 16,
  },
  info: {
    background: "#e8f5e9", border: "1px solid #c8e6c9", color: "#2e7d32",
    padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 16,
  },
};

/* ── Product Form (shared for create & edit) ── */
function ProductForm({ initial = FIELD_DEFAULTS, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const numField = (label, key) => (
    <div style={s.formRow} key={key}>
      <label style={s.label}>{label}</label>
      <input style={s.input} type="number" min="0" step="any"
        value={form[key]} onChange={set(key)} />
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      {error && <p style={s.error}>⚠️ {error}</p>}
      {[["Product Name *", "name", "text"], ["Brands", "brands", "text"],
        ["Categories", "categories", "text"], ["Packaging", "packaging", "text"]].map(([label, key, type]) => (
        <div style={s.formRow} key={key}>
          <label style={s.label}>{label}</label>
          <input style={s.input} type={type} value={form[key]} onChange={set(key)} />
        </div>
      ))}
      {numField("Ingredient Count", "ingredientCount")}
      {numField("Energy (kcal per 100g)", "energy100g")}
      {numField("Fat (g per 100g)", "fat100g")}
      {numField("Sugars (g per 100g)", "sugars100g")}
      {numField("Proteins (g per 100g)", "proteins100g")}
      {numField("Sodium (g per 100g)", "sodium100g")}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button type="submit" style={s.btn("primary")} disabled={loading}>
          {loading ? "Saving…" : "Save Product"}
        </button>
        <button type="button" style={s.btn("ghost")} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ── Products Tab ── */
function ProductsTab() {
  const [data, setData] = useState({ products: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Modal state: null | { mode: "create" } | { mode: "edit", product: {...} }
  const [modal, setModal] = useState(null);
  // Confirm delete: null | { id, name }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/products", { params: { q, page, pageSize: 20 } });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCreate = async (form) => {
    setFormLoading(true); setFormError("");
    try {
      await api.post("/admin/products", form);
      setModal(null); fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create product.");
    } finally { setFormLoading(false); }
  };

  const handleEdit = async (form) => {
    setFormLoading(true); setFormError("");
    try {
      await api.patch(`/admin/products/${modal.product._id}`, form);
      setModal(null); fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update product.");
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/products/${confirmDelete.id}`);
      setConfirmDelete(null); fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const totalPages = Math.ceil(data.total / 20);

  return (
    <div>
      <div style={s.toolbar}>
        <input style={s.searchInput} placeholder="Search products…"
          value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button style={s.btn("primary")} onClick={() => { setFormError(""); setModal({ mode: "create" }); }}>
          ➕ Add Product
        </button>
      </div>

      {error && <p style={{ ...s.error, margin: "12px 16px" }}>⚠️ {error}</p>}
      {loading ? (
        <p style={{ padding: 20, color: "#888" }}>Loading products…</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Brand", "Category", "Grade", "Health Score", "Actions"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.products.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#888" }}>No products found.</td></tr>
                ) : data.products.map((p) => (
                  <tr key={p._id} style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fbf8"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}>
                    <td style={s.td}><strong>{p.name}</strong></td>
                    <td style={s.td}>{p.brands || "—"}</td>
                    <td style={{ ...s.td, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.categories || "—"}
                    </td>
                    <td style={s.td}>
                      <span style={s.tag(gradeColor(p.nutritionGrade))}>
                        {(p.nutritionGrade || "?").toUpperCase()}
                      </span>
                    </td>
                    <td style={s.td}>
                      {p.healthScore !== null && p.healthScore !== undefined
                        ? <span style={{ fontWeight: "bold", color: p.healthScore >= 60 ? "#2e7d32" : p.healthScore >= 40 ? "#f9a825" : "#c62828" }}>{p.healthScore}</span>
                        : <span style={{ color: "#aaa" }}>—</span>}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={s.btn("secondary")}
                          onClick={() => { setFormError(""); setModal({ mode: "edit", product: p }); }}>
                          Edit
                        </button>
                        <button style={s.btn("danger")}
                          onClick={() => setConfirmDelete({ id: p._id, name: p.name })}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, padding: 14, alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, color: "#666" }}>
                Page {page} of {totalPages} ({data.total} products)
              </span>
              <button style={s.btn("ghost")} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button style={s.btn("ghost")} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 16px", color: "var(--hunter-green)" }}>
              {modal.mode === "create" ? "Add New Product" : `Edit: ${modal.product.name}`}
            </h3>
            <ProductForm
              initial={modal.mode === "edit" ? modal.product : FIELD_DEFAULTS}
              onSubmit={modal.mode === "create" ? handleCreate : handleEdit}
              onCancel={() => setModal(null)}
              loading={formLoading}
              error={formError}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 400 }}>
            <h3 style={{ color: "#c62828", margin: "0 0 12px" }}>Confirm Deletion</h3>
            <p style={{ fontSize: 15 }}>
              Are you sure you want to permanently delete <strong>"{confirmDelete.name}"</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={s.btn("danger")} onClick={handleDelete}>Yes, Delete</button>
              <button style={s.btn("ghost")} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Users Tab ── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/users")
      .then((r) => setUsers(r.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 20, color: "#888" }}>Loading users…</p>;
  if (error) return <p style={{ ...s.error, margin: 16 }}>⚠️ {error}</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Name", "Email", "Role", "Joined"].map((h) => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={4} style={{ ...s.td, textAlign: "center", color: "#888" }}>No users found.</td></tr>
          ) : users.map((u) => (
            <tr key={u._id}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f9fbf8"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}>
              <td style={s.td}><strong>{u.name}</strong></td>
              <td style={s.td}>{u.email}</td>
              <td style={s.td}>
                <span style={s.tag(u.role === "admin" ? "var(--hunter-green)" : "#546e57")}>
                  {u.role}
                </span>
              </td>
              <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ padding: "8px 16px", fontSize: 12, color: "#aaa" }}>
        {users.length} account{users.length !== 1 ? "s" : ""} — passwords and tokens are never shown here.
      </p>
    </div>
  );
}

/* ── Admin Panel Page ── */
function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    // Client-side guard — real security is enforced on the backend
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  return (
    <div style={s.page}>
      <h2 style={{ color: "var(--hunter-green)", marginBottom: 4 }}>🛠 Admin Panel</h2>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
        Manage the product catalogue and view account information.
      </p>

      <div style={s.tabs}>
        {[["products", "📦 Products"], ["users", "👥 Users"]].map(([id, label]) => (
          <button key={id} style={s.tab(activeTab === id)} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

export default AdminPanel;
