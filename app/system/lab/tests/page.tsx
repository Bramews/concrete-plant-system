"use client";

import { useState } from "react";

export default function LabTestsPage() {
  const [testType, setTestType] = useState("SLUMP");

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>
        Laboratory Tests - فحوصات المختبر
      </h2>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <button
          className={`btn ${testType === "SLUMP" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTestType("SLUMP")}
        >
          Slump
        </button>
        <button
          className={`btn ${testType === "SIEVE" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTestType("SIEVE")}
        >
          Sieve Analysis
        </button>
        <button
          className={`btn ${testType === "PYCNO" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTestType("PYCNO")}
        >
          Pycnometer (SSD)
        </button>
        <button
          className={`btn ${testType === "DENSITY" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTestType("DENSITY")}
        >
          Density / Unit Weight
        </button>
        <button
          className={`btn ${testType === "AIR" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTestType("AIR")}
        >
          Air Meter
        </button>
      </div>

      <div
        className="test-form-container"
        style={{
          padding: "1.5rem",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
        }}
      >
        {testType === "SLUMP" && (
          <div>
            <h3>Slump Test - فحص الهبوط</h3>
            <div className="input-field" style={{ marginTop: "1rem" }}>
              <label>Measured Slump (mm)</label>
              <input type="number" placeholder="100" />
            </div>
            <div className="input-field" style={{ marginTop: "1rem" }}>
              <label>Visual Check (Cohesion)</label>
              <select
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                <option>Good</option>
                <option>Fair</option>
                <option>Poor (Bleeding)</option>
              </select>
            </div>
          </div>
        )}

        {testType === "SIEVE" && (
          <div>
            <h3>Sieve Analysis - التحليل المنخلي</h3>
            <table
              className="data-table"
              style={{ width: "100%", marginTop: "1rem" }}
            >
              <thead>
                <tr>
                  <th>Sieve Size (mm)</th>
                  <th>Weight Retained (g)</th>
                  <th>% Passing</th>
                </tr>
              </thead>
              <tbody>
                {["20", "14", "10", "5", "2.36", "Pan"].map((size) => (
                  <tr key={size}>
                    <td>{size}</td>
                    <td>
                      <input type="number" style={{ width: "80px" }} />
                    </td>
                    <td>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {testType === "PYCNO" && (
          <div>
            <h3>Pycnometer Test - فحص البكنوميتر</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginTop: "1rem",
              }}
            >
              <div className="input-field">
                <label>Weight in Air (W1)</label>
                <input type="number" />
              </div>
              <div className="input-field">
                <label>Weight of Flask + Water (W2)</label>
                <input type="number" />
              </div>
              <div className="input-field">
                <label>Weight of Flask + SSD Material + Water (W3)</label>
                <input type="number" />
              </div>
              <div className="input-field">
                <label>Calculated SSD Density</label>
                <input
                  type="text"
                  readOnly
                  value="Pending..."
                  style={{ background: "rgba(0,0,0,0.1)" }}
                />
              </div>
            </div>
          </div>
        )}

        {testType === "DENSITY" && (
          <div>
            <h3>Density / Unit Weight - الكثافة والوزن النوعي</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginTop: "1rem",
              }}
            >
              <div className="input-field">
                <label>Container Volume (L)</label>
                <input type="number" placeholder="7" />
              </div>
              <div className="input-field">
                <label>Net Weight (kg)</label>
                <input type="number" placeholder="16.5" />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <button className="btn btn-primary">Submit Test - تسجيل الفحص</button>
          <button className="btn btn-secondary">
            Print Report - طباعة التقرير
          </button>
        </div>
      </div>
    </div>
  );
}
