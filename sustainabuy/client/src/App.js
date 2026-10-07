import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import AdminPanel from "./pages/AdminPanel";
import ProducerDashboard from "./pages/ProducerDashboard";

/* ── Route guards ── */
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function ProducerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "producer" && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "producer") return <Navigate to="/producer-dashboard" replace />;
  return children;
}

/* ── Navbar ── */
function Navbar() {
  const { user, logout } = useAuth();

  const navLinkStyle = {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    padding: "6px 12px",
    borderRadius: "6px",
    transition: "background 0.15s",
  };

  return (
    <nav style={{
      padding: "12px 24px",
      background: "linear-gradient(90deg, #0d2b1d, #1a4731)",
      color: "white",
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center",
      boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    }}>
      {/* Brand */}
      <Link to="/" style={{ ...navLinkStyle, fontSize: "16px", fontWeight: 800, color: "#81c784", marginRight: 8 }}>
        🌿 SustainaBuy
      </Link>

      {/* Search — always visible */}
      <Link to="/search" style={navLinkStyle}>🔍 Search</Link>

      {/* Customer links */}
      {user && user.role !== "producer" && user.role !== "admin" && (
        <Link to="/dashboard" style={navLinkStyle}>📦 Dashboard</Link>
      )}

      {/* Producer links */}
      {user && (user.role === "producer" || user.role === "admin") && (
        <>
          <Link to="/producer-dashboard" style={{ ...navLinkStyle, color: "#90caf9" }}>🚀 Producer Hub</Link>
          <Link to="/add-product" style={navLinkStyle}>➕ Add Product</Link>
        </>
      )}

      {/* Admin link */}
      {user?.role === "admin" && (
        <Link to="/admin" style={{ ...navLinkStyle, color: "#ce93d8", fontWeight: 800 }}>🛠 Admin</Link>
      )}

      {/* Role badge + auth */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {user && (
          <span style={{
            padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
            background: user.role === "producer"
              ? "rgba(33,150,243,0.2)"
              : user.role === "admin"
              ? "rgba(206,147,216,0.2)"
              : "rgba(76,175,80,0.2)",
            color: user.role === "producer" ? "#90caf9" : user.role === "admin" ? "#ce93d8" : "#a5d6a7",
            border: "1px solid currentColor",
          }}>
            {user.role === "producer" ? "🚀 Producer" : user.role === "admin" ? "🛠 Admin" : "🛒 Customer"}
          </span>
        )}
        {user ? (
          <>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Hi, {user.name}</span>
            <button
              onClick={logout}
              style={{
                padding: "6px 14px", borderRadius: 6, background: "rgba(255,255,255,0.1)",
                color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "13px",
              }}
            >Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ ...navLinkStyle, color: "#a5d6a7" }}>Login</Link>
            <Link to="/signup" style={{
              ...navLinkStyle,
              background: "rgba(76,175,80,0.2)",
              color: "#a5d6a7",
              border: "1px solid rgba(76,175,80,0.3)",
            }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Customer dashboard */}
          <Route path="/dashboard" element={
            <CustomerRoute><Dashboard /></CustomerRoute>
          } />

          {/* Producer dashboard */}
          <Route path="/producer-dashboard" element={
            <ProducerRoute><ProducerDashboard /></ProducerRoute>
          } />

          {/* Add product — producers only */}
          <Route path="/add-product" element={
            <ProducerRoute><AddProduct /></ProducerRoute>
          } />

          {/* Admin panel — admin only */}
          <Route path="/admin" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;