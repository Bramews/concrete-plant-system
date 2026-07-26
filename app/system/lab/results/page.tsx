import { requireRole } from "@/lib/auth";

export default async function LabResultsPage() {
  await requireRole(["LAB_TECH", "MANAGER"]);

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>Test Results - نتائج الفحوصات</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Mock Result Card */}
        <div
          className="card"
          style={{
            padding: "1.5rem",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h3>Sample #CUBE-902</h3>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Age: 7 Days</span>
            <span className="status-badge status-LOG_SUCCESS">PASSED</span>
          </div>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.5rem" }}
          >
            28.5 MPa
          </div>
        </div>
      </div>
    </div>
  );
}
