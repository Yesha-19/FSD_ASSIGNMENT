import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/search");
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "30px", background: "white", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "var(--hunter-green)", textAlign: "center", marginBottom: "20px" }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid var(--dry-sage)", boxSizing: "border-box" }} />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid var(--dry-sage)", boxSizing: "border-box" }} />
        {error && <p style={{ color: "white", background: "#d32f2f", padding: 10, borderRadius: 6, fontSize: "14px", marginTop: "0" }}>⚠️ {error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", border: "none" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "20px" }}>No account? <Link to="/signup" style={{ fontWeight: "bold" }}>Sign up</Link></p>
    </div>
  );
}

export default Login;