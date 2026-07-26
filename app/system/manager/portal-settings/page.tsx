import {
  getPortalSettings,
  savePortalSettings,
} from "@/app/actions/portal-settings";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface ToggleProps {
  name: string;
  label: string;
  value: string;
  description?: string;
}

// مكوّن Toggle معرّف خارج الـ render لتفادي أخطاء React Compiler و ESLint
function Toggle({ name, label, value, description }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-all">
      <div className="flex-1">
        <p className="font-bold text-white text-sm">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          name={name}
          value="true"
          defaultChecked={value === "true"}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-all" />
        <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-[-20px]" />
      </div>
    </label>
  );
}

export default async function PortalSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const settings = await getPortalSettings();

  return (
    <div dir="rtl" className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">
          ⚙️ إعدادات بوابة العملاء
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          تحكّم في ما يراه عملاؤك في البوابة الإلكترونية
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          await savePortalSettings(formData);
        }}
        className="space-y-4"
      >
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            التحكم الرئيسي
          </h2>

          <Toggle
            name="portal_enabled"
            label="تفعيل البوابة"
            value={settings.portal_enabled}
            description="إيقافها يمنع العملاء من الوصول كلياً"
          />

          <Toggle
            name="portal_require_login"
            label="تسجيل الدخول إلزامي"
            value={settings.portal_require_login}
            description="إذا أُوقف، يمكن الوصول برابط عام (GuestLink)"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            الأقسام المرئية
          </h2>

          <Toggle
            name="portal_show_orders"
            label="عرض الطلبات"
            value={settings.portal_show_orders}
            description="يرى العميل حالة طلباته ومراحلها"
          />

          <Toggle
            name="portal_show_lab"
            label="عرض نتائج المختبر"
            value={settings.portal_show_lab}
            description="يرى العميل نتائج الكسر وشهادات الجودة"
          />

          <Toggle
            name="portal_show_invoices"
            label="عرض الفواتير"
            value={settings.portal_show_invoices}
            description="يرى العميل فواتيره وحالة سدادها"
          />

          <Toggle
            name="portal_show_tracking"
            label="عرض موقع الشاحنة"
            value={settings.portal_show_tracking}
            description="يرى العميل موقع شاحنته في الزمن الحقيقي"
          />

          <Toggle
            name="portal_show_project_progress"
            label="عرض تقدم المشروع"
            value={settings.portal_show_project_progress}
            description="يرى العميل الكمية المنفذة من مشروعه"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            رسالة ترحيب مخصصة
          </h2>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">بالعربي</label>
            <textarea
              name="portal_custom_message_ar"
              defaultValue={settings.portal_custom_message_ar}
              rows={2}
              placeholder="أهلاً بكم في بوابة عملائنا..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">بالإنجليزي</label>
            <textarea
              name="portal_custom_message_en"
              defaultValue={settings.portal_custom_message_en}
              rows={2}
              placeholder="Welcome to our client portal..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all active:scale-95"
        >
          حفظ الإعدادات
        </button>
      </form>
    </div>
  );
}
