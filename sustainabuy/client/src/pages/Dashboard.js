import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/history").then((res) => setHistory(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h2>Your Saved History</h2>
      {history.length === 0 && <p>No products saved yet.</p>}
      {history.map((h) => (
        <div key={h._id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 8 }}>
          <Link to={`/product/${h.product?._id}`}>{h.product?.name}</Link>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;