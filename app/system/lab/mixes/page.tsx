"use client";

import { useState } from "react";

interface Ingredient {
  material: string;
  weight: number; // kg
  volume?: number; // Liters
  density?: number; // kg/m³
}

export default function MixDesignPage() {
  const [mixCode, setMixCode] = useState("");
  const [strength, setStrength] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { material: "Cement", weight: 0 },
    { material: "Water", weight: 0 },
    { material: "Coarse Aggregate", weight: 0 },
    { material: "Fine Aggregate", weight: 0 },
  ]);

  const totalWeight = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.weight) || 0),
    0,
  );

  // Verification logic (using totalWeight)

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>Mix Design - تصاميم الخلطات</h2>

      <div
        className="grid-form"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div className="input-field">
          <label>Mix Code - رمز الخلطة</label>
          <input
            type="text"
            value={mixCode}
            onChange={(e) => setMixCode(e.target.value)}
            placeholder="e.g. C30-OPC"
          />
        </div>
        <div className="input-field">
          <label>Strength (MPa) - المقاومة</label>
          <input
            type="number"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            placeholder="30"
          />
        </div>
      </div>

      <table
        className="data-table"
        style={{ width: "100%", marginBottom: "2rem" }}
      >
        <thead>
          <tr>
            <th>Material - المادة</th>
            <th>Weight (kg) - الوزن</th>
            <th>Calculated Volume (L) - الحجم</th>
            <th>Unit Price ($/kg) - السعر</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing, idx) => (
            <tr key={idx}>
              <td>{ing.material}</td>
              <td>
                <input
                  type="number"
                  value={ing.weight}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].weight = Number(e.target.value);
                    setIngredients(newIngs);
                  }}
                  style={{ width: "80px" }}
                />
              </td>
              <td>{(ing.weight / 2.5).toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  style={{ width: "80px" }}
                  placeholder="0.00"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          padding: "1rem",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <span>Total Weight - الوزن الإجمالي:</span>
          <span style={{ fontWeight: 600 }}>{totalWeight} kg</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Verification (1m³) - التحقق:</span>
          {/* Simple validation logic */}
          <span
            className={`status-badge ${Math.abs(totalWeight - 2400) < 500 ? "status-LOG_SUCCESS" : "status-LOG_FAIL"}`}
          >
            {Math.abs(totalWeight - 2400) < 500
              ? "Valid 1m³ Content"
              : "Adjust Quantities"}
          </span>
        </div>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button className="btn btn-primary">Save Mix - حفظ الخلطة</button>
        <button className="btn btn-secondary">
          Calculate Density - حساب الكثافة
        </button>
      </div>
    </div>
  );
}
