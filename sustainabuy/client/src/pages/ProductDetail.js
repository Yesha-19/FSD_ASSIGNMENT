import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/products/${id}/score`).then((res) => setData(res.data));
  }, [id]);

  const saveToHistory = async () => {
    try {
      await api.post("/history", { productId: id });
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>{data.product.name}</h2>
      <p>Brand: {data.product.brands}</p>
      <p>Nutrition Grade: {data.product.nutritionGrade?.toUpperCase()}</p>
      <p>Nutrition Score (dataset): {data.product.nutritionScore}</p>
      <h3>AI Predicted Score: {data.predictedScore}</h3>

      {user && (
        <button onClick={saveToHistory} disabled={saved} style={{ padding: 10 }}>
          {saved ? "Saved to History" : "Save to History"}
        </button>
      )}
    </div>
  );
}

export default ProductDetail;