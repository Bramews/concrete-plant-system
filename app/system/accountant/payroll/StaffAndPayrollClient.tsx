"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  StaffMember,
  StaffDocument,
  saveStaffMember,
  deleteStaffMember,
  uploadStaffDocument,
  recordSalaryPayment,
} from "@/app/actions/payroll-staff";
import { toast } from "sonner";

const DEFAULT_STAFF_DEPARTMENTS = [
  "خدمات عامة ونظافة",
  "استقبال وضيافة (Reception)",
  "حراسة وأمن البوابات",
  "حركة ونقل (سائقين)",
  "صيانة وميكانيك",
  "إنتاج وتشغيل",
  "مختبر وجودة",
  "إدارة ومبيعات",
  "مالية ومحاسبة",
  "مشتريات ومخازن",
];
import {
  Users,
  UserPlus,
  FileText,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  X,
  Upload,
  Eye,
  FileCheck,
  Printer,
  Search,
  Phone,
  Calendar,
  Building,
  ShieldAlert,
  Download,
  CreditCard,
  Settings,
} from "lucide-react";

interface StaffAndPayrollClientProps {
  initialStaff: StaffMember[];
  payrolls: any[];
  initialDepartments?: string[];
  kpis: {
    totalPayroll: number;
    paidAmount: number;
    pendingAmount: number;
    staffCount: number;
    currency: string;
  };
  companyId: number;
}

export function StaffAndPayrollClient({
  initialStaff,
  payrolls: initialPayrolls,
  initialDepartments = DEFAULT_STAFF_DEPARTMENTS,
  kpis,
  companyId,
}: StaffAndPayrollClientProps) {
  const [activeTab, setActiveTab] = useState<"PAYROLL_SHEET" | "STAFF_DIRECTORY">("PAYROLL_SHEET");
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [payrollsList, setPayrollsList] = useState<any[]>(initialPayrolls);
  const [search, setSearch] = useState("");

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingDocsStaff, setViewingDocsStaff] = useState<StaffMember | null>(null);
  const [payoutStaff, setPayoutStaff] = useState<StaffMember | null>(null);

  // Departments List
  const allDepartments = React.useMemo(() => {
    const set = new Set(
      initialDepartments && initialDepartments.length > 0
        ? initialDepartments
        : DEFAULT_STAFF_DEPARTMENTS,
    );
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [initialDepartments, staffList]);

  // Form Fields for Staff
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState(allDepartments[0] || "خدمات عامة ونظافة");
  const [salaryType, setSalaryType] = useState<"MONTHLY" | "DAILY" | "PIECE_RATE">("MONTHLY");
  const [baseSalary, setBaseSalary] = useState<number>(800000);
  const [phone, setPhone] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [documents, setDocuments] = useState<StaffDocument[]>([]);

  // Payout Form States
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [payoutNotes, setPayoutNotes] = useState("");

  // File Upload State
  const [uploadingDocType, setUploadingDocType] = useState<StaffDocument["type"]>("NATIONAL_ID");
  const [uploadingDocTitle, setUploadingDocTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPending, startTransition] = useTransition();

  const openNewStaffModal = () => {
    setEditingStaff(null);
    setName("");
    setJobTitle("");
    setDepartment("خدمات عامة");
    setSalaryType("MONTHLY");
    setBaseSalary(800000);
    setPhone("");
    setNationalIdNumber("");
    setJoinDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setDocuments([]);
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setJobTitle(staff.jobTitle);
    setDepartment(staff.department);
    setSalaryType(staff.salaryType);
    setBaseSalary(staff.baseSalary);
    setPhone(staff.phone || "");
    setNationalIdNumber(staff.nationalIdNumber || "");
    setJoinDate(staff.joinDate || new Date().toISOString().split("T")[0]);
    setNotes(staff.notes || "");
    setDocuments(staff.documents || []);
    setIsStaffModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadStaffDocument(formData);
        if (res.success && res.fileUrl) {
          const docTypeLabel =
            uploadingDocType === "NATIONAL_ID"
              ? "البطاقة الوطنية / الهوية"
              : uploadingDocType === "DRIVING_LICENSE"
              ? "إجازة السوق"
              : uploadingDocType === "PASSPORT"
              ? "جواز السفر"
              : uploadingDocType === "RESIDENCE"
              ? "بطاقة السكن"
              : uploadingDocType === "CONTRACT"
              ? "عقد العمل"
              : "مستمسك رسمي";

          const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
          const finalTitle =
            uploadingDocTitle.trim()
              ? files.length > 1
                ? `${uploadingDocTitle.trim()} (${i + 1})`
                : uploadingDocTitle.trim()
              : `${docTypeLabel} - ${cleanFileName}`;

          const newDoc: StaffDocument = {
            id: `DOC-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
            type: uploadingDocType,
            title: finalTitle,
            fileUrl: res.fileUrl,
            uploadedAt: new Date().toISOString().split("T")[0],
          };
          setDocuments((prev) => [...prev, newDoc]);
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "تم رفع وحفظ المستمسك بنجاح"
            : `تم رفع ${successCount} مستمسكات ثبوتية بنجاح`
        );
        setUploadingDocTitle("");
      } else {
        toast.error("فشل رفع الملفات المحددة");
      }
    } catch {
      toast.error("حدث خطأ أثناء رفع المستندات");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSaveStaff = () => {
    if (!name.trim() || !jobTitle.trim()) {
      toast.error("اسم الموظف والمسمى الوظيفي حقول إلزامية");
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveStaffMember(companyId, {
          id: editingStaff?.id,
          name: name.trim(),
          jobTitle: jobTitle.trim(),
          department,
          salaryType,
          baseSalary: Number(baseSalary),
          phone: phone.trim() || undefined,
          nationalIdNumber: nationalIdNumber.trim() || undefined,
          joinDate,
          status: "ACTIVE",
          documents,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          toast.success(editingStaff ? "تم تحديث بيانات الموظف بنجاح" : "تمت إضافة الموظف لسجل الحسابات بنجاح");
          setIsStaffModalOpen(false);
          const savedMember: StaffMember = {
            id: res.staffId,
            companyId,
            name: name.trim(),
            jobTitle: jobTitle.trim(),
            department,
            salaryType,
            baseSalary: Number(baseSalary),
            phone: phone.trim() || undefined,
            nationalIdNumber: nationalIdNumber.trim() || undefined,
            joinDate,
            status: "ACTIVE",
            documents,
            notes: notes.trim() || undefined,
          };

          setStaffList((prev) => {
            const index = prev.findIndex((s) => s.id === res.staffId);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = savedMember;
              return copy;
            }
            return [savedMember, ...prev];
          });
        }
      } catch {
        toast.error("حدث خطأ أثناء حفظ الموظف");
      }
    });
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموظف (${staffName}) من سجل الكادر؟`)) return;

    startTransition(async () => {
      try {
        const res = await deleteStaffMember(companyId, staffId);
        if (res.success) {
          toast.success("تم حذف الموظف بنجاح");
          setStaffList((prev) => prev.filter((s) => s.id !== staffId));
        }
      } catch {
        toast.error("فشل حذف الموظف");
      }
    });
  };

  const handleExecuteSalaryPayout = () => {
    if (!payoutStaff || payoutAmount <= 0) {
      toast.error("يرجى إدخال مبلغ الراتب الصحيح للصرف");
      return;
    }

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    startTransition(async () => {
      try {
        const res = await recordSalaryPayment(companyId, {
          staffName: payoutStaff.name,
          jobTitle: payoutStaff.jobTitle,
          amount: payoutAmount,
          month: currentMonth,
          paymentMethod: payoutMethod,
          notes: payoutNotes,
        });

        if (res.success) {
          toast.success(`تم صرف راتب الموظف (${payoutStaff.name}) بمبلغ ${payoutAmount.toLocaleString()} ${kpis.currency} وترحيله لدفتر الحسابات`);
          setPayoutStaff(null);
          setPayrollsList((prev) => [
            {
              id: res.payrollId,
              user: { name: payoutStaff.name, userRoles: [{ role: { displayName: payoutStaff.jobTitle } }] },
              amount: payoutAmount,
              month: currentMonth,
              status: "PAID",
            },
            ...prev,
          ]);
        }
      } catch {
        toast.error("حدث خطأ أثناء ترحيل الراتب");
      }
    });
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            رواتب الموظفين وسجل الكادر الشامل
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            إدارة كافة موظفي وعمال المحطة الميدانيين والإداريين، رفع المستمسكات الثبوتية، وصرف الرواتب
          </p>
        </div>

        {/* Tab Switcher & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab("PAYROLL_SHEET")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === "PAYROLL_SHEET"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              كشف الرواتب الشهرية
            </button>
            <button
              onClick={() => setActiveTab("STAFF_DIRECTORY")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === "STAFF_DIRECTORY"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              دليل الكادر والمستمسكات ({staffList.length})
            </button>
          </div>

          {activeTab === "STAFF_DIRECTORY" && (
            <button
              onClick={openNewStaffModal}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف / عامل جديد</span>
            </button>
          )}

          {activeTab === "PAYROLL_SHEET" && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>طباعة كشف الاستلام</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">إجمالي كادر المحطة</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {staffList.length}
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            موظفين وعمال مسجلين
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">إجمالي كتلة الرواتب</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {kpis.totalPayroll.toLocaleString()} <span className="text-xs">{kpis.currency}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            استحقاقات الشهر الحالي
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">الرواتب المصروفة</span>
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-violet-300 font-mono">
            {kpis.paidAmount.toLocaleString()} <span className="text-xs">{kpis.currency}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            مسددة بترحيل محاسبي
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">بانتظار الصرف</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {kpis.pendingAmount.toLocaleString()} <span className="text-xs">{kpis.currency}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            رواتب معلقة للشهر
          </span>
        </div>
      </div>

      {/* TAB 1: PAYROLL SHEET */}
      {activeTab === "PAYROLL_SHEET" && (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              كشف رواتب ومستحقات الشهر الحالي
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              الشهر: {new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    اسم الموظف / العامل
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    المسمى الوظيفي
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    القسم
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    الراتب الأساسي
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5 text-center">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5 text-center print:hidden">
                    صرف الراتب
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                      لا يوجد موظفون مسجلون في كشف الرواتب
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-bold text-xs">
                        <span className="px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/5">
                          {staff.jobTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {staff.department}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-emerald-400 text-sm">
                        {staff.baseSalary.toLocaleString()} {kpis.currency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          نشط بالكشف
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center print:hidden">
                        <button
                          onClick={() => {
                            setPayoutStaff(staff);
                            setPayoutAmount(staff.baseSalary);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 mx-auto"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          صرف الراتب
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY & DOCUMENTS */}
      {activeTab === "STAFF_DIRECTORY" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الموظف، المسمى الوظيفي (نظافة، استقبال، حراسة، سائق...) أو القسم..."
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-11 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/[0.02] transition-all font-bold"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/[0.01]">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                      الموظف
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                      المسمى الوظيفي والقسم
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                      الراتب المحدد
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                      المستمسكات الثبوتية
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                      تاريخ المباشرة
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5 text-center">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                        لا يوجد موظفون مطابقون لخيارات البحث
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-sm">
                                {staff.name}
                              </span>
                              {staff.phone && (
                                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {staff.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-white block text-xs">
                            {staff.jobTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {staff.department}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                          {staff.baseSalary.toLocaleString()} {kpis.currency}
                        </td>

                        <td className="px-6 py-4">
                          {staff.documents && staff.documents.length > 0 ? (
                            <button
                              onClick={() => setViewingDocsStaff(staff)}
                              className="px-3 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>{staff.documents.length} مستمسك مرفوع</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openEditStaffModal(staff)}
                              className="text-[11px] text-slate-500 hover:text-slate-300 italic flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>+ إرفاق مستمسكات</span>
                            </button>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {staff.joinDate}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditStaffModal(staff)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                              title="تعديل الموظف"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {!staff.isSystemUser && (
                              <button
                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                title="حذف من السجل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT STAFF MEMBER */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col text-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                {editingStaff ? `تعديل بيانات الموظف (${editingStaff.name})` : "إضافة موظف / كادر جديد للمحطة"}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Row 1: Name & Job Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">اسم الموظف / العامل *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد علي حسين..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    المسمى الوظيفي (حر تماماً) *
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: عامل نظافة، استقبال، سائق، حارس، ميكانيكي..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Department & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-bold block">القسم / التصنيف *</label>
                    <Link
                      href="/system/accountant/settings"
                      target="_blank"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline"
                      title="إدارة وتخصيص الأقسام في صفحة الإعدادات"
                    >
                      <Settings className="w-3 h-3" />
                      <span>إدارة الأقسام (الضبط)</span>
                    </Link>
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none font-bold"
                  >
                    {allDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    الراتب الأساسي ({kpis.currency}) *
                  </label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Phone & National ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0770..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">رقم الهوية / الأحوال (اختياري)</label>
                  <input
                    type="text"
                    value={nationalIdNumber}
                    onChange={(e) => setNationalIdNumber(e.target.value)}
                    placeholder="رقم البطاقة الوطنية..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section: Document Uploads */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">
                      المستمسكات الثبوتية والوثائق (اختياري)
                    </span>
                    {documents.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                        {documents.length} مرفقة
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    هوية، بطاقة سكن، جواز، عقد عمل
                  </span>
                </div>

                {/* Upload Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={uploadingDocType}
                    onChange={(e) => setUploadingDocType(e.target.value as any)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="NATIONAL_ID">البطاقة الوطنية / الهوية</option>
                    <option value="RESIDENCE">بطاقة السكن</option>
                    <option value="PASSPORT">جواز السفر</option>
                    <option value="DRIVING_LICENSE">إجازة / رخصة السوق</option>
                    <option value="CONTRACT">عقد العمل / اتفاقية</option>
                    <option value="OTHER">مستمسك آخر</option>
                  </select>

                  <input
                    type="text"
                    value={uploadingDocTitle}
                    onChange={(e) => setUploadingDocTitle(e.target.value)}
                    placeholder="عنوان المستمسك (اختياري)..."
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />

                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      className="hidden"
                      id="staff-doc-file"
                    />
                    <label
                      htmlFor="staff-doc-file"
                      className={`w-full h-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isUploading ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? "جاري الرفع..." : "+ اختر ملف وارفعه"}</span>
                    </label>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {documents.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white">{doc.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({doc.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-indigo-400"
                            title="معاينة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            title="حذف"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveStaff}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isPending ? "جاري الحفظ..." : "حفظ الموظف بالسجل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW ATTACHED DOCUMENTS */}
      {viewingDocsStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                المستمسكات الثبوتية ({viewingDocsStaff.name})
              </h3>
              <button
                onClick={() => setViewingDocsStaff(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {viewingDocsStaff.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block text-sm">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      نوع الوثيقة: {doc.type} | تاريخ الرفع: {doc.uploadedAt}
                    </span>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    معاينة وتنزيل
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setViewingDocsStaff(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYOUT SALARY */}
      {payoutStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                صرف راتب الموظف ({payoutStaff.name})
              </h3>
              <button
                onClick={() => setPayoutStaff(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">المسمى الوظيفي:</span>
                  <span className="font-bold text-white">{payoutStaff.jobTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">القسم:</span>
                  <span className="font-bold text-white">{payoutStaff.department}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-emerald-400 font-bold">الراتب الأساسي المستحق:</span>
                  <span className="font-mono font-black text-emerald-400">
                    {payoutStaff.baseSalary.toLocaleString()} {kpis.currency}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">
                  مبلغ الصرف الفعلي ({kpis.currency}) *
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("CASH")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === "CASH"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/[0.02] border-white/5 text-slate-400"
                    }`}
                  >
                    نقداً (صندوق المحطة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("BANK_TRANSFER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === "BANK_TRANSFER"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/[0.02] border-white/5 text-slate-400"
                    }`}
                  >
                    تحويل بنكي / محفظة
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">ملاحظات الصرف المحاسبية</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="مثال: صرف راتب الشهر مع مكافأة إنتاج..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayoutStaff(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteSalaryPayout}
                disabled={isPending || payoutAmount <= 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isPending ? "جاري الترحيل..." : "تأكيد وصرف الراتب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
