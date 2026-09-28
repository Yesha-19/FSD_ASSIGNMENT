import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/history");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setHistory(history.filter(h => h._id !== id));
    } catch (err) {
      console.error("Failed to remove item", err);
      alert("Failed to remove item: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "20px", background: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "var(--hunter-green)" }}>Your Saved History</h2>
      {history.length === 0 && <p style={{ color: "var(--pine-teal)" }}>No products saved yet.</p>}
      {history.map((h) => (
        <div key={h._id} style={{ border: "1px solid var(--dry-sage)", padding: 15, marginBottom: 12, borderRadius: 6, background: "#fdfdfd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link to={`/product/${h.product?._id}`} style={{ fontWeight: "bold", fontSize: "16px" }}>{h.product?.name}</Link>
          </div>
          <button onClick={() => handleRemove(h._id)} style={{ padding: "6px 12px", background: "#d32f2f", color: "white", borderRadius: "4px", fontSize: "12px", cursor: "pointer", border: "none" }}>Remove</button>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;