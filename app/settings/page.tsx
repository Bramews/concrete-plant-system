import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import {
  getPlantEfficiencyScore,
  getAIOptimizationTips,
} from "@/lib/ai-service";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];

  const efficiency = await getPlantEfficiencyScore();
  const tips = await getAIOptimizationTips();

  return (
    <div>
      <h1 className="page-title">
        {typeof t.settings === "string" ? t.settings : "الإعدادات"}
      </h1>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ color: "var(--primary)", marginBottom: "1.5rem" }}>
            {t.appTitle || "Concrete Plant System"}
          </h2>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#94a3b8",
                  marginBottom: "0.5rem",
                }}
              >
                {t.systemVer || "System Version"}
              </h3>
              <p style={{ margin: 0 }}>v1.0.5-activation</p>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#94a3b8",
                  marginBottom: "0.5rem",
                }}
              >
                {"البيئة"}
              </h3>
              <p style={{ margin: 0 }}>Production Mode</p>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#94a3b8",
                  marginBottom: "0.5rem",
                }}
              >
                {"حالة قاعدة البيانات"}
              </h3>
              <p style={{ margin: 0, color: "#10b981" }}>● Connected</p>
            </div>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "2rem",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <h2 style={{ color: "#10b981", marginBottom: "1.5rem" }}>
            {"مساعد ذكاء اصطناعي للتحسين"}
          </h2>

          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                color: efficiency.score > 80 ? "#10b981" : "#f59e0b",
              }}
            >
              {efficiency.score}%
            </div>
            <p style={{ color: "#94a3b8" }}>{"مؤشر كفاءة المحطة"}</p>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <h4 style={{ margin: 0, color: "#cbd5e1" }}>{"نصائح التحسين"}</h4>
            {tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  padding: "0.8rem",
                  background: "rgba(16, 185, 129, 0.05)",
                  borderRadius: "8px",
                  borderLeft: "3px solid #10b981",
                  fontSize: "0.9rem",
                }}
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
