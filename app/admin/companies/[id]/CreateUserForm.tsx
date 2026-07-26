"use client";

import { createCompanyUser } from "@/app/actions/companies";
import { Icons } from "@/components/ui/Icons";
import { useRef, useState, useTransition } from "react";
import { translateRole } from "@/lib/role-translations";
import { toast } from "@/lib/toast";
import { useFieldValidation } from "@/hooks/useFieldValidation";

const ROLE_DESCRIPTIONS: Record<
  string,
  { label: string; desc: string; perms: string[] }
> = {
  COMPANY_ADMIN: {
    label: "مدير الشركة (المالك التنفيذي)",
    desc: "إدارة الحسابات العامة، إعدادات الشركة، الفواتير والاشتراكات، وتعيين الأدوار لكافة الموظفين.",
    perms: [
      "إدارة حساب الشركة والاشتراكات",
      "إنشاء وتعديل صلاحيات الموظفين",
      "عرض كافة السجلات المالية والتقارير",
    ],
  },
  MANAGER: {
    label: "مدير المعمل (المسؤول التشغيلي والفني)",
    desc: "الموافقة النهائية على طلبيات المبيعات، ومراقبة المواد الأولية والمعدات، ومتابعة الإنتاج وسير العمل الميداني.",
    perms: [
      "الموافقة على طلبيات المبيعات وإلغاؤها",
      "إدارة المواد الأولية والمعدات والماكينات",
      "مراقبة الإنتاج وحركة النقل",
    ],
  },
  DEPARTMENT_MANAGER: {
    label: "مسؤول متابعة الإنتاج (متابعة الأقسام والإنتاج)",
    desc: "إدارة القسم المسؤول عنه، ومتابعة الطلبيات الخاصة بالقسم والإنتاج اليومي.",
    perms: [
      "عرض ومتابعة الطلبيات",
      "التنسيق مع مشغل لوحة التحكم",
      "متابعة الحضور وسير العمل بالقسم",
    ],
  },
  LAB_MANAGER: {
    label: "مدير المختبر (مسؤول الفحوصات والجودة)",
    desc: "إدارة عمليات الفحص المخبري للخرسانة والمواد الأولية، وتصميم الخلطات واعتمادها وتوثيق التقارير الرسمية.",
    perms: [
      "تصميم واعتماد خلطات الخرسانة وتجميدها",
      "إدخال نتائج المكعبات وفحص المواد",
      "إصدار شهادات جودة الخرسانة المعتمدة",
    ],
  },
  LAB_ENGINEER: {
    label: "مهندس المختبر (فحص وتصميم الخلطات)",
    desc: "إجراء التجارب وتصميم خلطات الخرسانة، ومتابعة الفحوصات الهندسية للركام والمواد.",
    perms: [
      "تصميم الخلطات وتجهيز تقارير تحليل المناخل",
      "متابعة فحوصات الخرسانة الطرية والقوام",
      "حساب نسب الرطوبة والمقاومة",
    ],
  },
  LAB_TECH: {
    label: "فني المختبر (أخذ النماذج الميدانية)",
    desc: "أخذ عينات الخرسانة من شاحنات التوصيل، وتجهيز مكعبات الفحص ووضعها في أحواض المعالجة.",
    perms: [
      "أخذ عينات الخرسانة الطرية وقياس الهبوط (Slump)",
      "تجهيز مكعبات الفحص وكسرها بالماكينات",
      "إدخال قراءات قوة الكسر في النظام",
    ],
  },
  LAB_WORKER: {
    label: "عامل مختبر (مساعد فني)",
    desc: "تنظيف القوالب، ومساعدة فني المختبر في نقل المكعبات وترتيب أحواض المعالجة والمحافظة على نظافة المختبر.",
    perms: [
      "مساعدة فني المختبر في الأعمال اليدوية",
      "تنظيف قوالب الفحص وتزييتها",
      "ترتيب عينات الفحص وتسهيل حركتها",
    ],
  },
  OPERATOR: {
    label: "مشغل لوحة التحكم (الخلط والإنتاج)",
    desc: "التحكم في خلاطة المحطة المركزية (Batching Plant)، ووزن المواد وتفريغها، وطباعة تذاكر التسليم للشاحنات.",
    perms: [
      "تشغيل لوحة التحكم والبدء بعملية الخلط والإنتاج",
      "إصدار وطباعة تذاكر تسليم الشاحنات (Delivery Tickets)",
      "مراقبة كميات المواد المفرغة من الصوامع",
    ],
  },
  WORKER: {
    label: "عامل معمل (أعمال الصيانة الميدانية)",
    desc: "القيام بأعمال النظافة الميدانية، ومساعدة المشغلين في الصيانة العامة للمحطة وتوجيه الشاحنات.",
    perms: [
      "تنظيف خلاطة المحطة والسيور الناقلة",
      "المساعدة في أعمال الصيانة الميكانيكية البسيطة",
      "تنظيف ساحات التخزين ومرافق المعمل",
    ],
  },
  ACCOUNTANT: {
    label: "محاسب مالي (إدارة الفواتير والرواتب)",
    desc: "إعداد الفواتير للزبائن، وتسجيل المصاريف اليومية للمعمل، ومتابعة الرواتب والأمور المالية الخاصة بالمؤسسة.",
    perms: [
      "إصدار فواتير المبيعات وتحصيل المقبوضات",
      "تسجيل النفقات والمصاريف التشغيلية للمعمل",
      "إعداد الرواتب للعمال والموظفين",
    ],
  },
  AUDITOR: {
    label: "مدقق حسابات (مراجعة الحسابات والتدقيق)",
    desc: "مراجعة القيود المحاسبية، وتدقيق الفواتير والمصاريف، والتأكد من مطابقة السجلات المالية للشركة والشفافية.",
    perms: [
      "مراجعة وتدقيق فواتير المبيعات والنفقات",
      "إصدار تقارير التدقيق المالي ومطابقة الأرصدة",
      "مراقبة الانحرافات المالية والوقاية من الأخطاء",
    ],
  },
  SALES_MANAGER: {
    label: "مدير المبيعات (إدارة الطلبيات والزبائن)",
    desc: "الإشراف على فريق المبيعات، وتسجيل ومتابعة طلبيات الزبائن، والاتفاق على الأسعار، والتنسيق لزيادة حجم المبيعات.",
    perms: [
      "تسجيل مشاريع وعملاء جدد",
      "إنشاء عروض الأسعار والطلبيات المبدئية",
      "متابعة أرقام المبيعات الشهرية وتقارير الأداء",
    ],
  },
  SALES_REP: {
    label: "مندوب مبيعات (متابعة الزبائن ميدانياً)",
    desc: "التواصل مع الزبائن، وجمع الطلبات الميدانية، ومتابعة تسليم الخرسانة ورضا العملاء.",
    perms: [
      "تسجيل طلبيات جديدة ومشاريعها الملحقة",
      "التنسيق بين العميل والمبيعات لتحديث المواعيد",
      "متابعة دفعات الزبائن وحل المشكلات",
    ],
  },
  DISPATCHER: {
    label: "مسؤول الحركة (توجيه الخلاطات والمضخات)",
    desc: "توجيه وجدولة حركة شاحنات الخرسانة والمضخات لتأمين وصول الطلبات للعملاء بأعلى كفاءة وسرعة.",
    perms: [
      "جدولة رحلات خلاطات الخرسانة والمضخات",
      "تتبع حركة السائقين وتعيين المسارات الجغرافية",
      "مراقبة زمن تفريغ الشاحنات وتذليل العقبات",
    ],
  },
  DRIVER: {
    label: "سائق (توصيل الخرسانة والتشغيل)",
    desc: "قيادة خلاطة الخرسانة الجاهزة أو المضخة، وتأمين وصول الشحنة لموقع العميل بأمان وجودة.",
    perms: [
      "قيادة الخلاطة والتأكد من استمرار تدوير الخرسانة",
      "توصيل الشحنة وتوقيع تذكرة الاستلام من العميل",
      "المحافظة على نظافة الخلاطة وخزان المياه",
    ],
  },
  SECURITY: {
    label: "حارس أمن (تأمين مداخل ومخارج المعمل)",
    desc: "مراقبة بوابة الدخول والخروج للمعمل، وتسجيل بيانات الزوار، وتأمين سلامة الآليات والممتلكات ليلاً ونهاراً.",
    perms: [
      "تسجيل حركة دخول وخروج الشاحنات والزوار",
      "تأمين وحماية بوابات ومرافق المصنع",
      "الإبلاغ عن أي خروقات أمنية أو حوادث سلامة",
    ],
  },
};

export function CreateUserForm({
  companyId,
  roles,
  companySlug,
}: {
  companyId: number;
  roles: { id: number; name: string; displayName: string | null }[];
  companySlug: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState(roles[0]?.name || "");

  const fullUsername = username
    ? username.includes("@")
      ? username
      : `${username}@${companySlug.toLowerCase()}`
    : "";

  const { isAvailable: isEmailAvailable, isValidating: isEmailValidating } =
    useFieldValidation("email", email);
  const {
    isAvailable: isUsernameAvailable,
    isValidating: isUsernameValidating,
  } = useFieldValidation("username", fullUsername);

  const hasErrors =
    isEmailAvailable === false ||
    isUsernameAvailable === false ||
    isEmailValidating ||
    isUsernameValidating;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createCompanyUser(companyId, formData);
        if (res?.error) {
          toast.error("خطأ: " + res.error);
        } else {
          toast.success("تم إنشاء المستخدم بنجاح");
          formRef.current?.reset();
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
      >
        <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="text-lg">إنشاء حساب جديد</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Icons.UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    إضافة مستخدم جديد
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    إكمال بيانات الحساب الجديد للشركة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق النافذة"
                title="إغلاق النافذة"
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icons.X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">
                    الاسم الكامل
                  </label>
                  <input
                    required
                    name="name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    placeholder="مثال: محمد أحمد"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1 flex justify-between">
                    <span>اسم المستخدم</span>
                    {isUsernameValidating && (
                      <span className="text-xs text-slate-400">
                        جاري التحقق...
                      </span>
                    )}
                  </label>
                  <div
                    className={`flex items-center w-full bg-slate-50 border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${isUsernameAvailable === false ? "border-red-400" : "border-slate-200"}`}
                    dir="ltr"
                  >
                    <input
                      id="create-username"
                      required
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-transparent border-none outline-none text-right font-mono font-bold text-slate-900 w-full"
                      placeholder="username_123"
                      dir="ltr"
                    />
                    <span className="text-slate-400 font-mono text-sm opacity-60 whitespace-nowrap select-none ml-1">
                      @{companySlug}
                    </span>
                  </div>
                  {isUsernameAvailable === false && (
                    <p className="text-xs text-red-500 font-bold px-2 animate-in fade-in">
                      اسم المستخدم هذا موجود بالفعل ومسجل لمستخدم آخر
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1 flex justify-between">
                    <span>البريد الإلكتروني</span>
                    {isEmailValidating && (
                      <span className="text-xs text-slate-400">
                        جاري التحقق...
                      </span>
                    )}
                  </label>
                  <input
                    required
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold ${isEmailAvailable === false ? "border-red-400" : "border-slate-200"}`}
                    placeholder="mail@example.com"
                  />
                  {isEmailAvailable === false && (
                    <p className="text-xs text-red-500 font-bold px-2 animate-in fade-in">
                      البريد الإلكتروني موجود بالفعل ومسجل لمستخدم آخر
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">
                    رقم الهاتف
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold"
                    placeholder="07XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">
                    كلمة المرور
                  </label>
                  <input
                    required
                    name="password"
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    placeholder="******"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">
                    الصلاحية (الدور)
                  </label>
                  <select
                    required
                    id="roleName"
                    name="roleName"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    aria-label="اختر صلاحية المستخدم"
                    title="اختر صلاحية المستخدم"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-bold animate-in fade-in"
                  >
                    {roles.map((role) => (
                      <option key={role.name} value={role.name}>
                        {translateRole(role.name, role.displayName)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Description Card */}
                {ROLE_DESCRIPTIONS[selectedRole] && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex items-center gap-2.5 transition-all animate-in fade-in duration-300">
                    <span className="text-lg flex-shrink-0 select-none">
                      💡
                    </span>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      <strong className="text-slate-700 ml-1">
                        {ROLE_DESCRIPTIONS[selectedRole].label}:
                      </strong>
                      {ROLE_DESCRIPTIONS[selectedRole].desc}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending || hasErrors}
                  className="flex-[2] bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 text-sm"
                >
                  {isPending ? (
                    <Icons.Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    "إتمام إنشاء الحساب"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
