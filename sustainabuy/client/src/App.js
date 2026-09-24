import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav style={{ padding: 15, background: "#2e7d32", color: "white", display: "flex", gap: 15 }}>
      <Link to="/search" style={{ color: "white" }}>Search</Link>
      {user && <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>}
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ marginRight: 10 }}>Hi, {user.name}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={{ color: "white" }}>Login</Link>
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;