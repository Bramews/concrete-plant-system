"use client";

import { useState } from "react";
import { AppCard, ActionButton } from "@/components/ui/IndustrialComponents";
import { updateReportConfig } from "@/app/actions/lab-reports"; // Need to pass companyId
import { toast } from "sonner";
import { Save, Image as ImageIcon } from "lucide-react";

interface ReportConfig {
  id?: string;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  reportTitleAr?: string;
  reportTitleEn?: string;
  footerText?: string | null;
  showQrCode?: boolean;
  showSignature?: boolean;
  signatureText?: string | null;
  themeColor?: string;
}

interface ReportSettingsFormProps {
  initialConfig: ReportConfig | null;
  companyId: number;
}

export function ReportSettingsForm({
  initialConfig,
  companyId,
}: ReportSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig || {
      companyNameAr: "",
      companyNameEn: "",
      logoUrl: "",
      phone: "",
      email: "",
      address: "",
      website: "",
      reportTitleAr: "شهادة فحص مختبري",
      reportTitleEn: "Laboratory Test Certificate",
      footerText: "",
      showQrCode: true,
      showSignature: true,
      signatureText: "Authorized Signatory",
      themeColor: "#000000",
    },
  );

  const handleChange = (field: keyof ReportConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateReportConfig(companyId, config);
      if (result.success) {
        toast.success("Report settings updated");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Information */}
        <AppCard title="Header Branding">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Company Name (Arabic)
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.companyNameAr || ""}
                  onChange={(e) =>
                    handleChange("companyNameAr", e.target.value)
                  }
                  placeholder="شركة الخرسانة..."
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Company Name (English)
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.companyNameEn || ""}
                  onChange={(e) =>
                    handleChange("companyNameEn", e.target.value)
                  }
                  placeholder="Concrete Co..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-500 uppercase">
                Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  value={config.logoUrl || ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="w-10 h-10 border rounded flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                  {config.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Phone
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Email
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>
        </AppCard>

        {/* Report Layout */}
        <AppCard title="Report Layout">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Report Title (Ar)
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.reportTitleAr || ""}
                  onChange={(e) =>
                    handleChange("reportTitleAr", e.target.value)
                  }
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Report Title (En)
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.reportTitleEn || ""}
                  onChange={(e) =>
                    handleChange("reportTitleEn", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-500 uppercase">
                Footer Text / Disclaimer
              </label>
              <textarea
                className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                value={config.footerText || ""}
                onChange={(e) => handleChange("footerText", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showQrCode}
                  onChange={(e) => handleChange("showQrCode", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Show QR Code
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSignature}
                  onChange={(e) =>
                    handleChange("showSignature", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Show Signature
                </span>
              </label>
            </div>

            {config.showSignature && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Signature Title
                </label>
                <input
                  type="text"
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.signatureText || ""}
                  onChange={(e) =>
                    handleChange("signatureText", e.target.value)
                  }
                />
              </div>
            )}
          </div>
        </AppCard>
      </div>

      <div className="flex justify-end">
        <ActionButton
          onClick={handleSubmit}
          isLoading={loading}
          className="px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </ActionButton>
      </div>
    </div>
  );
}
