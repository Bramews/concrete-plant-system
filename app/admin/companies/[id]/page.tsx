import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import {
  updateCompanyStatus,
  updateTenantVoiceSetting,
} from "@/app/actions/companies";
import { Mic, Volume2, VolumeX, Activity } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CreateUserForm } from "./CreateUserForm";
import { UserActions } from "./UserActions";
import { SubscriptionManager } from "./SubscriptionManager";
import { CompanyDetailsFormClient } from "./CompanyDetailsFormClient";
import React from "react";
import { translateRole, SYSTEM_ONLY_ROLES } from "@/lib/role-translations";
import { DictionaryType } from "@/lib/dictionary";

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) return notFound();

  // Fetch company with specific includes
  let company;
  try {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        license: true,
        domains: true,
        memberships: {
          where: {
            deletedAt: null,
            status: { not: "REMOVED" },
          },
          include: { user: true, role: true },
          orderBy: { role: { id: "asc" } },
        },
        subscription: { include: { plan: true } },
        _count: {
          select: {
            orders: true,
            projects: true,
            mixDesigns: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return (
      <div className="p-8 text-center text-red-500">
        حدث خطأ أثناء تحميل بيانات الشركة. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  if (!company) return notFound();

  // Fetch Voice Assistant Settings & Usage stats
  let voiceUsageCount = 0;
  let voiceEnabled = true;
  try {
    voiceUsageCount = await prisma.auditLog.count({
      where: { companyId, action: "VOICE_COMMAND" },
    });
    const voiceSetting = await prisma.companySetting.findUnique({
      where: {
        companyId_key: {
          companyId,
          key: "voice_assistant_enabled",
        },
      },
    });
    voiceEnabled = voiceSetting ? voiceSetting.value === "true" : true;
  } catch (error) {
    console.error("Error fetching voice assistant settings:", error);
  }

  // Fetch available roles for the form
  // Exclude sovereign roles (SYSTEM_OWNER) for security - these roles should never be assignable
  let availableRoles: {
    id: number;
    name: string;
    displayName: string | null;
  }[] = [];
  try {
    // 🔴 FALLBACK: Fetch ALL roles and filter in-memory to avoid Prisma invocation errors
    const allRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        companyId: true,
        isSovereign: true,
      },
    });

    availableRoles = allRoles.filter((r) => {
      // 1. Exclude sovereign roles
      if (r.isSovereign) return false;

      // 2. Exclude MANAGER role to merge it under COMPANY_ADMIN dropdown choices
      if (r.name === "MANAGER") return false;

      // 3. Include Global Roles (companyId === null) OR Local Roles (companyId === current)
      return r.companyId === null || r.companyId === companyId;
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
  }

  // Fetch all users through memberships
  const allUsers = company.memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    username: m.user.username,
    email: m.user.email,
    phone: m.user.phone,
    userStatus: m.user.status, // ← حالة الحساب الحقيقية من User
    membershipStatus: m.status, // ← حالة العضوية في الشركة
    roleId: m.roleId,
    roleName: translateRole(m.role.name, m.role.displayName),
  }));

  // Calculate subscription progress percentage based on real dates
  const subscriptionProgress = (() => {
    if (!company.subscription?.currentPeriodEnd) return 0;
    const start = new Date(company.subscription.currentPeriodStart).getTime();
    const end = new Date(company.subscription.currentPeriodEnd).getTime();
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (end <= start) return 0;
    return Math.min(
      100,
      Math.max(0, Math.round(((now - start) / (end - start)) * 100)),
    );
  })();

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-white/5 p-6 rounded-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/companies"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
          >
            <Icons.ArrowLeft className="w-5 h-5 transform rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <p className="text-slate-500 text-sm mt-1 font-mono">
              {company.slug} |{" "}
              {company.domains?.[0]?.domain || "لا يوجد نطاق مخصص"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              try {
                await updateCompanyStatus(
                  company.id,
                  company.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                );
                revalidatePath(`/admin/companies/${company.id}`);
              } catch (error) {
                console.error("Error updating status:", error);
              }
            }}
          >
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border ${
                company.status === "ACTIVE"
                  ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              }`}
            >
              {company.status === "ACTIVE" ? (
                <>
                  <Icons.ShieldAlert className="w-4 h-4" />
                  إيقاف الشركة
                </>
              ) : (
                <>
                  <Icons.ShieldCheck className="w-4 h-4" />
                  تنشيط الشركة
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="الطلبات الكلية"
          value={company._count.orders}
          icon={Icons.FileText}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="المستخدمين"
          value={company.memberships.length}
          icon={Icons.Users}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          label="المشاريع النشطة"
          value={company._count.projects}
          icon={Icons.Briefcase}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="تصاميم الخلطات"
          value={company._count.mixDesigns}
          icon={Icons.Mixer}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Company Details Form Card */}
          <CompanyDetailsFormClient company={company} />

          <CreateUserForm
            companyId={company.id}
            companySlug={company.slug}
            roles={availableRoles}
          />
        </div>

        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Voice Assistant Settings & Stats Card */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Mic className="w-4 h-4 text-indigo-400" />
                المساعد الصوتي (الذكاء الاصطناعي)
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                  voiceEnabled
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                    : "bg-slate-800 text-slate-500 border border-white/5"
                }`}
              >
                {voiceEnabled ? "مفعل للشركة" : "معطل للشركة"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    إجمالي استهلاك الأوامر الصوتية
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {voiceUsageCount}{" "}
                    <span className="text-xs text-slate-500">أمر</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  try {
                    await updateTenantVoiceSetting(companyId, !voiceEnabled);
                  } catch (error) {
                    console.error("Error toggling voice:", error);
                  }
                }}
              >
                <button
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${
                    voiceEnabled
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {voiceEnabled ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      تعطيل الأوامر الصوتية للشركة
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      تفعيل الأوامر الصوتية للشركة
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Subscription Info Card */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Icons.CreditCard className="w-4 h-4 text-purple-400" />
                الاشتراك والترخيص
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                  company.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                    : "bg-red-500/10 text-red-400 border border-red-500/15"
                }`}
              >
                {company.status === "ACTIVE" ? "نشط" : "متوقف"}
              </span>
            </div>

            {/* Plan + users limit row */}
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-white/5 border-b border-white/5">
              <div className="px-5 py-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  نوع الخطة
                </div>
                <div className="text-base font-bold text-white">
                  {company.subscription?.plan?.name ||
                    company.license?.type ||
                    "مجاني"}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  الحد الأقصى
                </div>
                <div className="text-base font-bold text-white">
                  {company.license?.maxUsers ||
                    company.subscription?.plan?.maxUsers ||
                    "∞"}
                  <span className="text-xs text-slate-500 mr-1">مستخدم</span>
                </div>
              </div>
            </div>

            {/* Subscription progress */}
            <div className="px-5 py-3 border-b border-white/5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  المدة المنقضية
                </span>
                <span
                  className="text-[10px] font-mono text-slate-500"
                  dir="ltr"
                >
                  {subscriptionProgress}%
                </span>
              </div>
              <div className="w-full bg-white/8 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    subscriptionProgress > 80
                      ? "bg-gradient-to-r from-amber-500 to-red-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                  } shadow-sm`}
                  style={{ width: `${subscriptionProgress}%` }}
                />
              </div>
            </div>

            {/* Subscription manager */}
            <div className="p-5">
              {company.subscription ? (
                <SubscriptionManager
                  companyId={company.id}
                  currentStart={company.subscription.currentPeriodStart}
                  currentEnd={company.subscription.currentPeriodEnd}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
                  <Icons.XCircle className="w-4 h-4 flex-shrink-0" />
                  لا يوجد سجل اشتراك لهذه الشركة.
                </div>
              )}
            </div>
          </div>

          {/* Accounts List Card */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Icons.Users className="w-4 h-4 text-emerald-400" />
                حسابات الشركة
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                {allUsers.length} حساب
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto overflow-x-auto">
              {allUsers.length > 0 ? (
                allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors group"
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-white/8 flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white leading-tight">
                            {user.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-bold flex-shrink-0">
                            {user.roleName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    {/* Right: actions */}
                    <div className="flex-shrink-0 mr-2">
                      <UserActions
                        userId={user.id}
                        companyId={company.id}
                        companySlug={company.slug}
                        initialData={{
                          name: user.name,
                          username: user.username,
                          email: user.email,
                          phone: user.phone || "",
                          roleId: user.roleId,
                          userStatus: user.userStatus as any,
                          membershipStatus: user.membershipStatus as any,
                        }}
                        availableRoles={availableRoles}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <Icons.Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">لا توجد حسابات مسجلة</p>
                </div>
              )}
            </div>
          </div>

          {/* RBAC Management Section */}
          <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icons.Lock className="w-5 h-5 text-amber-500" />
                الصلاحيات والأدوار
              </h2>
              <Link
                href={`/system/settings/rbac`}
                className="text-sm font-bold text-blue-400 hover:text-blue-300 underline"
              >
                * يفضل التعديل من حساب مدير الشركة
              </Link>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 text-center">
              <p className="text-slate-400 text-sm mb-4">
                يمكنك تعديل صلاحيات أدوار هذه الشركة أو إضافة أدوار جديدة.
              </p>

              <Link
                href={`/admin/companies/${company.id}/rbac`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all"
              >
                <Icons.Settings className="w-4 h-4" />
                إدارة صلاحيات هذه الشركة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl hover:border-white/10 transition-all">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${bg} ${color}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black text-white tracking-tight">
          {value}
        </div>
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  );
}
