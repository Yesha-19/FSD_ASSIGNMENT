import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─────────────────────────────────────────────
   NUTRI-SCORE GRADING LOGIC
   Based on the official FSA / ANSES algorithm
   (simplified version used by Open Food Facts)
   ─────────────────────────────────────────────
   NEGATIVE points (bad nutrients per 100g):
     Energy   : 0–10  (≤335kJ=0 … ≥3350kJ=10)
     Sugars   : 0–10  (≤4.5g=0  … ≥45g=10)
     Saturated: 0–10  (we use fat as proxy)
     Sodium   : 0–10  (≤90mg=0  … ≥900mg=10)
   POSITIVE points (good nutrients per 100g):
     Proteins : 0–5   (≤1.6g=0  … ≥8g=5)
   FINAL  = negative_total − positive_total
   GRADE:
     A  : score ≤ −1
     B  : 0 – 2
     C  : 3 – 10
     D  : 11 – 18
     E  : ≥ 19
──────────────────────────────────────────────── */

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function energyPoints(kj) {
  const thresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
  return thresholds.findIndex((t) => kj <= t) === -1 ? 10 : thresholds.findIndex((t) => kj <= t);
}

function sugarPoints(g) {
  const thresholds = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
  return thresholds.findIndex((t) => g <= t) === -1 ? 10 : thresholds.findIndex((t) => g <= t);
}

function fatPoints(g) {
  // Using saturated fat proxy via total fat; thresholds same scale
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return thresholds.findIndex((t) => g <= t) === -1 ? 10 : thresholds.findIndex((t) => g <= t);
}

function sodiumPoints(g) {
  // sodium in grams; thresholds 90mg increments
  const mg = g * 1000;
  const thresholds = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];
  return thresholds.findIndex((t) => mg <= t) === -1 ? 10 : thresholds.findIndex((t) => mg <= t);
}

function proteinPoints(g) {
  const thresholds = [1.6, 3.2, 4.8, 6.4, 8];
  const idx = thresholds.findIndex((t) => g <= t);
  return idx === -1 ? 5 : idx;
}

function calculateGrade(energy, fat, sugars, proteins, sodium) {
  const eP = energyPoints(Number(energy) || 0);
  const fP = fatPoints(Number(fat) || 0);
  const sP = sugarPoints(Number(sugars) || 0);
  const soP = sodiumPoints(Number(sodium) || 0);
  const prP = proteinPoints(Number(proteins) || 0);

  const negative = eP + fP + sP + soP;
  const positive = prP;
  const score = negative - positive;

  let grade = "e";
  if (score <= -1) grade = "a";
  else if (score <= 2) grade = "b";
  else if (score <= 10) grade = "c";
  else if (score <= 18) grade = "d";
  else grade = "e";

  return {
    grade,
    score,
    breakdown: {
      energy: { points: eP, raw: Number(energy) || 0, label: "Energy (kcal/100g)" },
      fat: { points: fP, raw: Number(fat) || 0, label: "Fat (g/100g)" },
      sugars: { points: sP, raw: Number(sugars) || 0, label: "Sugars (g/100g)" },
      sodium: { points: soP, raw: Number(sodium) || 0, label: "Sodium (g/100g)" },
      proteins: { points: prP, raw: Number(proteins) || 0, label: "Proteins (g/100g)" },
    },
    negative,
    positive,
  };
}

const GRADE_META = {
  a: {
    color: "#2e7d32",
    bg: "#e8f5e9",
    border: "#66bb6a",
    emoji: "🟢",
    label: "Excellent",
    desc: "This product has excellent nutritional quality. Low in energy, saturated fat, sugars and sodium — great for daily consumption.",
    tip: "✅ Safe to consume daily. Ideal for a balanced diet.",
  },
  b: {
    color: "#558b2f",
    bg: "#f1f8e9",
    border: "#9ccc65",
    emoji: "🟩",
    label: "Good",
    desc: "Good nutritional quality. Moderate in harmful nutrients with decent protein content.",
    tip: "✅ Generally good for regular consumption. A healthy choice.",
  },
  c: {
    color: "#f57f17",
    bg: "#fff8e1",
    border: "#ffca28",
    emoji: "🟡",
    label: "Average",
    desc: "Average nutritional quality. Contains moderate levels of one or more 'bad' nutrients (energy, fat, sugar, sodium).",
    tip: "⚠️ Consume in moderation. Not ideal as a daily staple.",
  },
  d: {
    color: "#e65100",
    bg: "#fff3e0",
    border: "#ffa726",
    emoji: "🟠",
    label: "Poor",
    desc: "Poor nutritional quality. High in at least one harmful nutrient. May contribute to health risks if consumed frequently.",
    tip: "⚠️ Limit consumption. Occasional treat only.",
  },
  e: {
    color: "#b71c1c",
    bg: "#ffebee",
    border: "#ef5350",
    emoji: "🔴",
    label: "Bad",
    desc: "Very poor nutritional quality. Significantly high in harmful nutrients. Strongly associated with increased health risks.",
    tip: "❌ Avoid regular consumption. Very high in unhealthy nutrients.",
  },
};

const defaultForm = {
  name: "",
  brands: "",
  categories: "",
  packaging: "",
  ingredientCount: "",
  energy100g: "",
  fat100g: "",
  sugars100g: "",
  proteins100g: "",
  sodium100g: "",
};

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "Product name is required.";
  if (form.energy100g === "" || isNaN(form.energy100g) || Number(form.energy100g) < 0)
    errs.energy100g = "Enter a valid energy value ≥ 0 kcal.";
  if (form.fat100g === "" || isNaN(form.fat100g) || Number(form.fat100g) < 0)
    errs.fat100g = "Enter a valid fat value ≥ 0g.";
  if (form.sugars100g === "" || isNaN(form.sugars100g) || Number(form.sugars100g) < 0)
    errs.sugars100g = "Enter a valid sugars value ≥ 0g.";
  if (form.proteins100g === "" || isNaN(form.proteins100g) || Number(form.proteins100g) < 0)
    errs.proteins100g = "Enter a valid proteins value ≥ 0g.";
  if (form.sodium100g === "" || isNaN(form.sodium100g) || Number(form.sodium100g) < 0)
    errs.sodium100g = "Enter a valid sodium value ≥ 0g.";
  if (form.ingredientCount !== "" && (isNaN(form.ingredientCount) || Number(form.ingredientCount) < 0))
    errs.ingredientCount = "Ingredient count must be a non-negative number.";
  // Cross-field: fat + sugars cannot exceed energy (approximate sanity)
  const totalMacroKcal =
    Number(form.fat100g || 0) * 9 + Number(form.sugars100g || 0) * 4 + Number(form.proteins100g || 0) * 4;
  if (
    form.energy100g !== "" &&
    !isNaN(form.energy100g) &&
    Number(form.energy100g) > 0 &&
    totalMacroKcal > Number(form.energy100g) * 1.25
  ) {
    errs._cross =
      "⚠️ The combined caloric contribution of fat, sugar, and protein exceeds the stated energy value by >25%. Please double-check your values.";
  }
  return errs;
}

export default function AddProduct() {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [gradeResult, setGradeResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [savedId, setSavedId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Live grade recalculation whenever nutritional values change
  useEffect(() => {
    const { energy100g, fat100g, sugars100g, proteins100g, sodium100g } = form;
    const allFilled = [energy100g, fat100g, sugars100g, proteins100g, sodium100g].every(
      (v) => v !== "" && !isNaN(v) && Number(v) >= 0
    );
    if (allFilled) {
      setGradeResult(calculateGrade(energy100g, fat100g, sugars100g, proteins100g, sodium100g));
    } else {
      setGradeResult(null);
    }
  }, [form.energy100g, form.fat100g, form.sugars100g, form.proteins100g, form.sodium100g]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, _cross: undefined }));
    setSaveMsg("");
    setSavedId(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitted(true);
  };

  const handleSaveToDB = async () => {
    if (!user) {
      alert("Please login to save a product to the database.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const payload = {
        name: form.name.trim(),
        brands: form.brands.trim() || "Unknown",
        categories: form.categories.trim() || "Unknown",
        packaging: form.packaging.trim() || "Unknown",
        ingredientCount: Number(form.ingredientCount) || 0,
        energy100g: Number(form.energy100g),
        fat100g: Number(form.fat100g),
        sugars100g: Number(form.sugars100g),
        proteins100g: Number(form.proteins100g),
        sodium100g: Number(form.sodium100g),
        nutritionScore: gradeResult?.score ?? null,
        nutritionGrade: gradeResult?.grade ?? "unknown",
      };
      const res = await api.post("/products", payload);
      setSavedId(res.data._id || res.data.product?._id);
      setSaveMsg("✅ Product saved to database successfully!");
    } catch (err) {
      setSaveMsg("❌ " + (err.response?.data?.message || "Failed to save. Is the server running?"));
    }
    setSaving(false);
  };

  const handleReset = () => {
    setForm(defaultForm);
    setErrors({});
    setGradeResult(null);
    setSubmitted(false);
    setSaveMsg("");
    setSavedId(null);
  };

  const meta = gradeResult ? GRADE_META[gradeResult.grade] : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f0 0%, #e8f0e9 100%)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <Link to="/search" style={{ color: "var(--hunter-green)", fontWeight: "bold", fontSize: 13 }}>
            ← Back to Search
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: "var(--hunter-green)", margin: 0,
            letterSpacing: "-0.5px"
          }}>
            🥗 Add & Analyze Product
          </h1>
          <p style={{ color: "var(--pine-teal)", marginTop: 8, fontSize: 15 }}>
            Enter nutritional details to instantly calculate the <strong>Nutri-Score grade</strong> with a detailed breakdown.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* ─── LEFT: FORM ─── */}
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e0e7e0"
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, color: "var(--pine-teal)", fontWeight: 700 }}>
              📋 Product Details
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              {/* Basic Info */}
              <Section title="Basic Information">
                <Field label="Product Name *" error={errors.name}>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Chocolate Cereal Bar"
                    style={inputStyle(errors.name)} />
                </Field>
                <Row>
                  <Field label="Brand" error={errors.brands}>
                    <input name="brands" value={form.brands} onChange={handleChange}
                      placeholder="e.g. Kellogg's"
                      style={inputStyle()} />
                  </Field>
                  <Field label="Category" error={errors.categories}>
                    <input name="categories" value={form.categories} onChange={handleChange}
                      placeholder="e.g. Snacks"
                      style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Packaging" error={errors.packaging}>
                    <input name="packaging" value={form.packaging} onChange={handleChange}
                      placeholder="e.g. Plastic, Glass"
                      style={inputStyle()} />
                  </Field>
                  <Field label="Ingredient Count" error={errors.ingredientCount}>
                    <input name="ingredientCount" value={form.ingredientCount} onChange={handleChange}
                      type="number" min="0" placeholder="e.g. 12"
                      style={inputStyle(errors.ingredientCount)} />
                  </Field>
                </Row>
              </Section>

              {/* Nutritional Values */}
              <Section title="Nutritional Values (per 100g) *">
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#888" }}>
                  These values are used to compute the Nutri-Score automatically.
                </p>

                <Field label="Energy (kcal)" error={errors.energy100g} hint="e.g. 450 kcal → typical for biscuits">
                  <input name="energy100g" value={form.energy100g} onChange={handleChange}
                    type="number" min="0" placeholder="e.g. 450"
                    style={inputStyle(errors.energy100g)} />
                </Field>
                <Row>
                  <Field label="Fat (g)" error={errors.fat100g} hint="Total fat. High fat = more negative pts">
                    <input name="fat100g" value={form.fat100g} onChange={handleChange}
                      type="number" min="0" step="0.1" placeholder="e.g. 10.5"
                      style={inputStyle(errors.fat100g)} />
                  </Field>
                  <Field label="Sugars (g)" error={errors.sugars100g} hint="Free/added sugars">
                    <input name="sugars100g" value={form.sugars100g} onChange={handleChange}
                      type="number" min="0" step="0.1" placeholder="e.g. 22"
                      style={inputStyle(errors.sugars100g)} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Proteins (g)" error={errors.proteins100g} hint="More protein = lower final score (good!)">
                    <input name="proteins100g" value={form.proteins100g} onChange={handleChange}
                      type="number" min="0" step="0.1" placeholder="e.g. 5.2"
                      style={inputStyle(errors.proteins100g)} />
                  </Field>
                  <Field label="Sodium (g)" error={errors.sodium100g} hint="High sodium is harmful. 1g salt ≈ 0.4g sodium">
                    <input name="sodium100g" value={form.sodium100g} onChange={handleChange}
                      type="number" min="0" step="0.01" placeholder="e.g. 0.3"
                      style={inputStyle(errors.sodium100g)} />
                  </Field>
                </Row>

                {errors._cross && (
                  <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#795548", marginTop: 8 }}>
                    {errors._cross}
                  </div>
                )}
              </Section>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" id="btn-analyze"
                  style={{ flex: 1, padding: "13px", borderRadius: 8, fontWeight: 700, fontSize: 15, background: "var(--hunter-green)", color: "white", border: "none", cursor: "pointer" }}>
                  🔍 Analyze Grade
                </button>
                <button type="button" onClick={handleReset}
                  style={{ padding: "13px 18px", borderRadius: 8, background: "#f5f5f5", color: "#555", border: "1px solid #ddd", cursor: "pointer", fontWeight: 600 }}>
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* ─── RIGHT: GRADE RESULT ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Live Preview — appears as soon as nutritional values are filled */}
            {gradeResult && !submitted && (
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: `2px dashed ${GRADE_META[gradeResult.grade].border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: 0, color: "#888", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>LIVE PREVIEW</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <GradeBadge grade={gradeResult.grade} size={56} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: GRADE_META[gradeResult.grade].color }}>
                      {GRADE_META[gradeResult.grade].label}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Score: {gradeResult.score} pts · Click Analyze for full breakdown</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Result */}
            {submitted && gradeResult && meta && (
              <>
                {/* Grade Banner */}
                <div style={{
                  background: meta.bg, border: `2px solid ${meta.border}`,
                  borderRadius: 16, padding: 24, textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.07)"
                }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: meta.color, fontWeight: 700, letterSpacing: 1 }}>
                    NUTRI-SCORE GRADE
                  </p>
                  <GradeBadge grade={gradeResult.grade} size={90} />
                  <h2 style={{ margin: "12px 0 4px", color: meta.color, fontSize: 26, fontWeight: 800 }}>
                    {meta.emoji} {meta.label}
                  </h2>
                  <p style={{ margin: "0 0 12px", color: "#555", fontSize: 14 }}>{meta.desc}</p>
                  <div style={{ background: meta.color, color: "white", borderRadius: 8, padding: "8px 14px", display: "inline-block", fontSize: 13, fontWeight: 600 }}>
                    {meta.tip}
                  </div>
                </div>

                {/* Score Explanation */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e8ede8" }}>
                  <h3 style={{ margin: "0 0 4px", color: "var(--pine-teal)", fontSize: 16 }}>📊 Score Breakdown</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
                    Final Score = <strong>Negative Points − Positive Points</strong> = {gradeResult.negative} − {gradeResult.positive} = <strong style={{ color: meta.color }}>{gradeResult.score}</strong>
                  </p>

                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#e53935", letterSpacing: 1 }}>NEGATIVE (HARMFUL)</p>
                  {["energy", "fat", "sugars", "sodium"].map((k) => {
                    const item = gradeResult.breakdown[k];
                    return (
                      <ScoreBar
                        key={k}
                        label={item.label}
                        value={item.raw}
                        points={item.points}
                        maxPoints={10}
                        color="#e53935"
                        direction="negative"
                        hint={getNegativeHint(k, item.raw, item.points)}
                      />
                    );
                  })}

                  <p style={{ margin: "16px 0 8px", fontSize: 12, fontWeight: 700, color: "#2e7d32", letterSpacing: 1 }}>POSITIVE (BENEFICIAL)</p>
                  <ScoreBar
                    label={gradeResult.breakdown.proteins.label}
                    value={gradeResult.breakdown.proteins.raw}
                    points={gradeResult.breakdown.proteins.points}
                    maxPoints={5}
                    color="#2e7d32"
                    direction="positive"
                    hint={getPositiveHint("proteins", gradeResult.breakdown.proteins.raw, gradeResult.breakdown.proteins.points)}
                  />

                  {/* Grade thresholds table */}
                  <div style={{ marginTop: 20 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--pine-teal)" }}>Grade Thresholds</p>
                    <GradeThresholdTable current={gradeResult.score} />
                  </div>
                </div>

                {/* Why this grade */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e8ede8" }}>
                  <h3 style={{ margin: "0 0 12px", color: "var(--pine-teal)", fontSize: 16 }}>🎓 Why this Grade?</h3>
                  <WhySection form={form} gradeResult={gradeResult} />
                </div>

                {/* How Nutri-Score Works */}
                <div style={{ background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderRadius: 16, padding: 24, border: "1px solid #c8e6c9" }}>
                  <h3 style={{ margin: "0 0 10px", color: "var(--hunter-green)", fontSize: 16 }}>ℹ️ How Nutri-Score Works</h3>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                    The <strong>Nutri-Score</strong> is a front-of-pack nutrition label developed by the French Agency ANSES and adopted by the FSA (UK) and multiple European countries. It ranks food on a 5-level color-coded scale from <strong style={{ color: "#2e7d32" }}>A (best)</strong> to <strong style={{ color: "#b71c1c" }}>E (worst)</strong>.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 2 }}>
                    <li>🔴 <strong>Negative nutrients</strong>: Energy, Saturated Fat, Sugars, Sodium — each scored 0–10</li>
                    <li>🟢 <strong>Positive nutrients</strong>: Proteins — scored 0–5 (reduces total score)</li>
                    <li>📐 <strong>Formula</strong>: Score = (Energy + Fat + Sugar + Sodium) − Proteins</li>
                    <li>📑 <strong>All values</strong> are measured per 100g of product</li>
                  </ul>
                </div>

                {/* Save to DB */}
                <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e0e7e0", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  {user ? (
                    <>
                      <button
                        onClick={handleSaveToDB}
                        disabled={saving || !!savedId}
                        id="btn-save-product"
                        style={{
                          width: "100%", padding: "13px", borderRadius: 8, fontWeight: 700, fontSize: 15,
                          background: savedId ? "var(--dry-sage)" : "var(--hunter-green)",
                          color: "white", border: "none",
                          cursor: (saving || savedId) ? "default" : "pointer"
                        }}>
                        {saving ? "Saving..." : savedId ? "✔ Saved to Database" : "💾 Save Product to Database"}
                      </button>
                      {saveMsg && (
                        <p style={{ marginTop: 10, fontSize: 13, color: saveMsg.startsWith("✅") ? "#2e7d32" : "#c62828", fontWeight: 600 }}>
                          {saveMsg}
                          {savedId && (
                            <Link to={`/product/${savedId}`} style={{ marginLeft: 8, color: "var(--hunter-green)", textDecoration: "underline" }}>
                              View Product →
                            </Link>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>
                      <Link to="/login" style={{ color: "var(--hunter-green)", fontWeight: "bold" }}>Login</Link> to save this product to the database.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Empty state */}
            {!gradeResult && !submitted && (
              <div style={{
                background: "white", borderRadius: 16, padding: 40, textAlign: "center",
                border: "2px dashed #cdd8cd", boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
              }}>
                <p style={{ fontSize: 48, margin: "0 0 12px" }}>🥗</p>
                <p style={{ margin: 0, color: "#aaa", fontSize: 15 }}>
                  Fill in the <strong>nutritional values</strong> on the left to see the live grade preview here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Sub-components ───── */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--hunter-green)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}

function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--pine-teal)", marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {hint && !error && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#999" }}>{hint}</p>}
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c62828", fontWeight: 500 }}>⚠ {error}</p>}
    </div>
  );
}

function inputStyle(error) {
  return {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 7,
    border: `1.5px solid ${error ? "#f44336" : "#d0d8d0"}`,
    outline: "none",
    fontSize: 14,
    color: "#333",
    background: error ? "#fff8f8" : "white",
    boxSizing: "border-box",
    transition: "border 0.2s",
  };
}

function GradeBadge({ grade, size = 60 }) {
  const meta = GRADE_META[grade];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: meta.color, color: "white",
      fontSize: size * 0.4, fontWeight: 900,
      boxShadow: `0 4px 14px ${meta.color}55`,
      flexShrink: 0,
    }}>
      {grade.toUpperCase()}
    </div>
  );
}

function ScoreBar({ label, value, points, maxPoints, color, direction, hint }) {
  const pct = (points / maxPoints) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {direction === "negative" ? `+${points}` : `-${points}`} pts &nbsp;
          <span style={{ color: "#aaa", fontWeight: 400 }}>({value}{label.includes("Energy") ? " kcal" : "g"})</span>
        </span>
      </div>
      <div style={{ height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
      {hint && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#999", fontStyle: "italic" }}>{hint}</p>}
    </div>
  );
}

function GradeThresholdTable({ current }) {
  const rows = [
    { grade: "A", range: "≤ −1", color: "#2e7d32", bg: "#e8f5e9" },
    { grade: "B", range: "0 to 2", color: "#558b2f", bg: "#f1f8e9" },
    { grade: "C", range: "3 to 10", color: "#f57f17", bg: "#fff8e1" },
    { grade: "D", range: "11 to 18", color: "#e65100", bg: "#fff3e0" },
    { grade: "E", range: "≥ 19", color: "#b71c1c", bg: "#ffebee" },
  ];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={thStyle}>Grade</th>
          <th style={thStyle}>Score Range</th>
          <th style={thStyle}>Your Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isMatch =
            (r.grade === "A" && current <= -1) ||
            (r.grade === "B" && current >= 0 && current <= 2) ||
            (r.grade === "C" && current >= 3 && current <= 10) ||
            (r.grade === "D" && current >= 11 && current <= 18) ||
            (r.grade === "E" && current >= 19);
          return (
            <tr key={r.grade} style={{ background: isMatch ? r.bg : "transparent" }}>
              <td style={{ ...tdStyle, fontWeight: 700, color: r.color }}>{r.grade}</td>
              <td style={tdStyle}>{r.range}</td>
              <td style={{ ...tdStyle, fontWeight: isMatch ? 700 : 400, color: isMatch ? r.color : "#aaa" }}>
                {isMatch ? `← ${current}` : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const thStyle = { padding: "6px 10px", textAlign: "left", borderBottom: "2px solid #eee", color: "#888", fontWeight: 600 };
const tdStyle = { padding: "6px 10px", borderBottom: "1px solid #f0f0f0" };

function WhySection({ form, gradeResult }) {
  const { energy100g: e, fat100g: f, sugars100g: s, proteins100g: p, sodium100g: so } = form;
  const { negative, positive, score, grade, breakdown } = gradeResult;
  const meta = GRADE_META[grade];
  const reasons = [];

  if (breakdown.energy.points >= 7) reasons.push({ icon: "⚡", text: `Very high energy (${e} kcal/100g) — adds ${breakdown.energy.points}/10 negative points. High-energy foods contribute to caloric overconsumption.`, type: "bad" });
  else if (breakdown.energy.points <= 2) reasons.push({ icon: "⚡", text: `Low energy (${e} kcal/100g) — only ${breakdown.energy.points}/10 negative points. Ideal.`, type: "good" });

  if (breakdown.fat.points >= 7) reasons.push({ icon: "🧈", text: `High fat (${f}g/100g) — adds ${breakdown.fat.points}/10 negative points. Excess fat is linked to cardiovascular risk.`, type: "bad" });
  else if (breakdown.fat.points <= 2) reasons.push({ icon: "🧈", text: `Low fat (${f}g/100g) — only ${breakdown.fat.points}/10 negative points.`, type: "good" });

  if (breakdown.sugars.points >= 7) reasons.push({ icon: "🍬", text: `Very high sugar (${s}g/100g) — adds ${breakdown.sugars.points}/10 negative points. High sugar is linked to obesity, diabetes, and tooth decay.`, type: "bad" });
  else if (breakdown.sugars.points <= 2) reasons.push({ icon: "🍬", text: `Low sugar (${s}g/100g) — only ${breakdown.sugars.points}/10 negative points.`, type: "good" });

  if (breakdown.sodium.points >= 7) reasons.push({ icon: "🧂", text: `High sodium (${so}g/100g = ${(Number(so) * 2500).toFixed(0)}mg salt) — adds ${breakdown.sodium.points}/10 negative points. Excess sodium raises blood pressure.`, type: "bad" });
  else if (breakdown.sodium.points <= 2) reasons.push({ icon: "🧂", text: `Low sodium (${so}g/100g) — only ${breakdown.sodium.points}/10 negative points.`, type: "good" });

  if (breakdown.proteins.points >= 4) reasons.push({ icon: "💪", text: `Good protein content (${p}g/100g) — removes ${breakdown.proteins.points}/5 positive points from the total. Proteins are beneficial and reduce the final score.`, type: "good" });
  else if (breakdown.proteins.points <= 1) reasons.push({ icon: "💪", text: `Low protein (${p}g/100g) — only removes ${breakdown.proteins.points}/5 from score. Higher protein foods score better.`, type: "neutral" });

  if (reasons.length === 0) reasons.push({ icon: "📊", text: `All nutrient values are in a moderate range, resulting in a combined score of ${score}.`, type: "neutral" });

  return (
    <div>
      {reasons.map((r, i) => (
        <div key={i} style={{
          display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 8,
          background: r.type === "bad" ? "#fff5f5" : r.type === "good" ? "#f4fff4" : "#f8f8f8",
          border: `1px solid ${r.type === "bad" ? "#ffcccc" : r.type === "good" ? "#c8f0c8" : "#e8e8e8"}`
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
          <p style={{ margin: 0, fontSize: 13, color: "#444", lineHeight: 1.6 }}>{r.text}</p>
        </div>
      ))}
      <p style={{ margin: "12px 0 0", fontSize: 13, color: "#666", padding: "10px 14px", background: "#f5f5f5", borderRadius: 8, lineHeight: 1.7 }}>
        <strong>Summary:</strong> Total negative score = {negative} pts, total positive (protein) = {positive} pts.
        Final Nutri-Score = <strong style={{ color: meta.color }}>{score}</strong>, which falls in the <strong style={{ color: meta.color }}>Grade {gradeResult.grade.toUpperCase()}</strong> range ({meta.label}).
      </p>
    </div>
  );
}

function getNegativeHint(key, val, pts) {
  if (pts <= 2) return "Low — great!";
  if (pts <= 5) return "Moderate";
  if (pts <= 8) return "High — reduces grade";
  return "Very high — major penalty";
}

function getPositiveHint(key, val, pts) {
  if (pts >= 4) return "High protein — significantly improves grade";
  if (pts >= 2) return "Moderate protein — some benefit";
  return "Low protein — little benefit to score";
}
