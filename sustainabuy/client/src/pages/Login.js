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
        // No response at all = server is down or not reachable
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          style={{ width: "100%", padding: 8, marginBottom: 10 }} />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          style={{ width: "100%", padding: 8, marginBottom: 10 }} />
        {error && <p style={{ color: "red", background: "#fff3f3", padding: 8, borderRadius: 4 }}>⚠️ {error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}

export default Login;