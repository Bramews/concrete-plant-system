"use client";

import { useState } from "react";
import { THEMES } from "@/lib/themes";
import { setTheme } from "@/app/actions/theme";
import { useRouter } from "next/navigation";

export default function ThemeSwitcher({
  currentTheme,
}: {
  currentTheme: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleThemeChange = async (themeId: string) => {
    await setTheme(themeId);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <div className="account-wrapper" style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-icon"
        title="Switch Theme"
        style={{ background: "none", border: "none", padding: "8px" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="account-dropdown"
          style={{
            opacity: 1,
            visibility: "visible",
            transform: "translateY(0)",
            width: "280px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <div className="profile-mini">
            <span className="profile-name">Select System Identity</span>
            <span className="profile-role">15 Industrial Themes</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "4px",
              padding: "4px",
            }}
          >
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`dropdown-item ${currentTheme === theme.id ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  background:
                    currentTheme === theme.id
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    background: `var(--theme-${theme.id}-primary, #ccc)`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                    {theme.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                    {theme.layout.replace("LAYOUT_", "").toLowerCase()} •{" "}
                    {theme.density}
                  </div>
                </div>
                {currentTheme === theme.id && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
