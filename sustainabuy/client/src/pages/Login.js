import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      // Redirect based on role
      if (res.data.user.role === "producer") {
        navigate("/producer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  const cardStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d2b1d 0%, #1a4731 50%, #0f3321 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "20px",
  };

  const boxStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "44px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const btnStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    background: loading
      ? "rgba(100,180,100,0.4)"
      : "linear-gradient(90deg, #2e7d32, #4caf50)",
    color: "#fff",
    letterSpacing: "0.5px",
    transition: "opacity 0.2s",
    marginTop: "4px",
  };

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🌿</div>
          <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: "800", margin: 0 }}>SustainaBuy</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "6px 0 0" }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{
              background: "rgba(211,47,47,0.2)",
              border: "1px solid rgba(211,47,47,0.5)",
              color: "#ff8a80",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "14px",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button id="login-submit" type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Role hint */}
        <div style={{
          marginTop: "24px",
          padding: "16px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            You'll be redirected to:
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{
              flex: 1, textAlign: "center", padding: "10px",
              background: "rgba(76,175,80,0.12)", borderRadius: "8px",
              border: "1px solid rgba(76,175,80,0.25)",
            }}>
              <div style={{ fontSize: "20px" }}>🛒</div>
              <div style={{ color: "#a5d6a7", fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>Customer</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Your Dashboard</div>
            </div>
            <div style={{
              flex: 1, textAlign: "center", padding: "10px",
              background: "rgba(33,150,243,0.1)", borderRadius: "8px",
              border: "1px solid rgba(33,150,243,0.2)",
            }}>
              <div style={{ fontSize: "20px" }}>🚀</div>
              <div style={{ color: "#90caf9", fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>Producer</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Producer Hub</div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#81c784", fontWeight: "700", textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;