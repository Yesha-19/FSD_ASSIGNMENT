import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Signup failed. Please try again.");
      }
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "30px", background: "white", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "var(--hunter-green)", textAlign: "center", marginBottom: "20px" }}>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid var(--dry-sage)", boxSizing: "border-box" }} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid var(--dry-sage)", boxSizing: "border-box" }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid var(--dry-sage)", boxSizing: "border-box" }} />
        {error && <p style={{ color: "white", background: "#d32f2f", padding: 10, borderRadius: 6, fontSize: "14px", marginTop: "0" }}>{error}</p>}
        {success && <p style={{ color: "var(--fern)", fontWeight: "bold", textAlign: "center" }}>Registered! Redirecting to login...</p>}
        <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", border: "none" }}>Sign Up</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "20px" }}>Already have an account? <Link to="/login" style={{ fontWeight: "bold" }}>Login</Link></p>
    </div>
  );
}

export default Signup;