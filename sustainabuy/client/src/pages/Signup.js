import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Signup() {
  const [step, setStep]         = useState(1);       // 1 = choose role, 2 = fill form
  const [role, setRole]         = useState("");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  const selectRole = (r) => { setRole(r); setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { name, email, password, role });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Signup failed. Please try again.");
      }
    }
  };

  const pageStyle = {
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
    maxWidth: "480px",
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
  };

  const roleCardBase = {
    flex: 1,
    padding: "28px 20px",
    borderRadius: "14px",
    cursor: "pointer",
    textAlign: "center",
    border: "2px solid",
    transition: "transform 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={pageStyle}>
      <div style={boxStyle}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🌿</div>
          <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: "800", margin: 0 }}>
            {step === 1 ? "Join SustainaBuy" : "Create Account"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "6px 0 0" }}>
            {step === 1 ? "Choose how you'll use the platform" : `Signing up as ${role === "producer" ? "Product Introducer 🚀" : "Customer 🛒"}`}
          </p>
        </div>

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Customer card */}
            <div
              id="role-customer"
              onClick={() => selectRole("user")}
              style={{
                ...roleCardBase,
                background: "rgba(76,175,80,0.1)",
                borderColor: "rgba(76,175,80,0.4)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(76,175,80,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ fontSize: "44px", marginBottom: "12px" }}>🛒</div>
              <h3 style={{ color: "#a5d6a7", margin: "0 0 8px", fontSize: "17px" }}>Customer</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                Search products, save favourites, rate items & discover greener alternatives
              </p>
            </div>

            {/* Producer card */}
            <div
              id="role-producer"
              onClick={() => selectRole("producer")}
              style={{
                ...roleCardBase,
                background: "rgba(33,150,243,0.1)",
                borderColor: "rgba(33,150,243,0.3)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(33,150,243,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ fontSize: "44px", marginBottom: "12px" }}>🚀</div>
              <h3 style={{ color: "#90caf9", margin: "0 0 8px", fontSize: "17px" }}>Product Introducer</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                Launch products, track reviews, view analytics & manage your catalogue
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — Registration form */}
        {step === 2 && (
          <>
            {/* Role badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: role === "producer" ? "rgba(33,150,243,0.15)" : "rgba(76,175,80,0.15)",
              border: `1px solid ${role === "producer" ? "rgba(33,150,243,0.3)" : "rgba(76,175,80,0.3)"}`,
              borderRadius: "20px", padding: "6px 14px", marginBottom: "20px", cursor: "pointer",
            }} onClick={() => setStep(1)}>
              <span style={{ color: role === "producer" ? "#90caf9" : "#a5d6a7", fontSize: "13px", fontWeight: "600" }}>
                {role === "producer" ? "🚀 Product Introducer" : "🛒 Customer"}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>← change</span>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                id="signup-name"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                id="signup-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                id="signup-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />

              {error && (
                <div style={{
                  background: "rgba(211,47,47,0.2)", border: "1px solid rgba(211,47,47,0.5)",
                  color: "#ff8a80", padding: "10px 14px", borderRadius: "8px",
                  fontSize: "13px", marginBottom: "14px",
                }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: "rgba(76,175,80,0.2)", border: "1px solid rgba(76,175,80,0.4)",
                  color: "#a5d6a7", padding: "10px 14px", borderRadius: "8px",
                  fontSize: "13px", marginBottom: "14px", textAlign: "center",
                }}>
                  ✅ Account created! Redirecting to login…
                </div>
              )}

              <button
                id="signup-submit"
                type="submit"
                style={{
                  width: "100%", padding: "14px", borderRadius: "10px",
                  fontSize: "16px", fontWeight: "700", border: "none", cursor: "pointer",
                  background: role === "producer"
                    ? "linear-gradient(90deg, #1565c0, #1e88e5)"
                    : "linear-gradient(90deg, #2e7d32, #4caf50)",
                  color: "#fff", letterSpacing: "0.5px",
                }}
              >
                Create Account
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#81c784", fontWeight: "700", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;