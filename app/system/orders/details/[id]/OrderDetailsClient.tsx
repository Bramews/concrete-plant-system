"use client";

import { Icons } from "@/components/ui/Icons";
import { MapPin, Trash2, Scale, Cpu } from "lucide-react";
import { format } from "date-fns";
import { updateOrderStatus } from "@/app/actions/orders";
import { deleteOrder } from "@/app/actions/order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Locale, getDictionary } from "@/lib/dictionary";
import { ActualBatchWeightsModal } from "@/components/orders/ActualBatchWeightsModal";

interface OrderDetailsClientProps {
  order: any;
  userRole: string;
  lang: Locale;
}

const STATUS_FLOW = [
  "PENDING_APPROVAL",
  "APPROVED",
  "LAB_APPROVED",
  "PRODUCTION",
  "DISPATCHED",
  "DELIVERED",
];

export function OrderDetailsClient({
  order,
  userRole,
  lang,
}: OrderDetailsClientProps) {
  const router = useRouter();
  const isAr = lang === "ar";
  const dict = getDictionary(lang);

  const canManage = [
    "DISPATCHER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ].includes(userRole);
  const [updating, setUpdating] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  // Parse lab approval mixData to get ETA
  let approvedEta = "";
  if (order.labApproval?.mixData) {
    try {
      const approvalData = JSON.parse(order.labApproval.mixData);
      if (approvalData.eta) {
        approvedEta = approvalData.eta;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const rawLocation = order.project?.location || "";
  let siteAddress = rawLocation;
  let gpsCoords = "";
  let fileAttachment = "";

  const gpsMatch = rawLocation.match(/\(GPS:\s*([^)]+)\)/);
  const fileMatch = rawLocation.match(/\(FILE:\s*([^)]+)\)/);

  if (gpsMatch) {
    gpsCoords = gpsMatch[1].trim();
    siteAddress = siteAddress.replace(/\(GPS:\s*([^)]+)\)/, "").trim();
  }
  if (fileMatch) {
    fileAttachment = fileMatch[1].trim();
    siteAddress = siteAddress.replace(/\(FILE:\s*([^)]+)\)/, "").trim();
  }
  siteAddress = siteAddress.replace(/\(\s*\)/g, "").trim();

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const getStatusLabel = (status: string) => {
    if (!isAr) return status;
    switch (status) {
      case "PENDING_APPROVAL":
        return "بانتظار الموافقة";
      case "APPROVED":
        return "تم القبول";
      case "LAB_APPROVED":
        return "موافقة المختبر";
      case "PENDING":
        return "قيد الانتظار";
      case "PRODUCTION":
        return "قيد الإنتاج";
      case "DISPATCHED":
        return "تم الإرسال";
      case "DELIVERED":
        return "تم التوصيل";
      case "CANCELLED":
      case "CANCELED":
        return "ملغي";
      case "REJECTED":
        return "مرفوض";
      case "SUBMITTED":
        return "بانتظار موافقة المختبر";
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: isAr ? "تأكيد تغيير حالة الطلب" : "Confirm Status Change",
      description: isAr
        ? `هل أنت متأكد من تغيير حالة الطلب إلى "${getStatusLabel(newStatus)}"؟`
        : `Are you sure you want to change status to ${newStatus}?`,
      action: async () => {
        try {
          setUpdating(true);
          await updateOrderStatus(order.id, newStatus, reason);
          toast.success(
            isAr
              ? `تم تحديث حالة الطلب إلى ${getStatusLabel(newStatus)}`
              : `Status updated to ${newStatus}`,
          );
          router.refresh(); // Refresh data
        } catch (e: any) {
          toast.error(
            e.message ||
              (isAr ? "فشل تحديث حالة الطلب" : "Failed to update status"),
          );
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleDelete = async () => {
    setConfirmConfig({
      isOpen: true,
      title: isAr ? "تأكيد حذف الطلب" : "Confirm Delete",
      description: isAr
        ? "هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this order permanently? This action cannot be undone.",
      action: async () => {
        setUpdating(true);
        try {
          const formData = new FormData();
          formData.append("id", order.id.toString());
          const res = await deleteOrder(formData);
          if (res.success) {
            toast.success(
              isAr ? "تم حذف الطلب بنجاح" : "Order deleted successfully",
            );
            router.push("/system/orders");
          } else {
            toast.error(res.error || "Failed to delete order");
          }
        } catch (err: any) {
          toast.error(err.message || "Delete failed");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  return (
    <div
      className="space-y-8 animate-in fade-in duration-300"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* REJECTION REASON MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
            dir={isAr ? "rtl" : "ltr"}
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icons.AlertTriangle className="w-5 h-5 text-rose-500" />
              {isAr ? "سبب الرفض / الإلغاء" : "Rejection / Cancellation Reason"}
            </h3>
            <p className="text-slate-400 text-sm">
              {isAr
                ? "الرجاء كتابة سبب إلغاء أو رفض هذا الطلب بوضوح للتوثيق والتدقيق المالي والعملي."
                : "Please write the reason for cancelling or rejecting this order clearly for documentation and financial audits."}
            </p>
            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder={
                isAr ? "اكتب السبب هنا..." : "Write the reason here..."
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-rose-500/50 transition-all h-28 resize-none font-bold"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg font-bold text-sm transition-all"
              >
                {isAr ? "تراجع" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (!rejectReasonText.trim()) {
                    toast.error(
                      isAr
                        ? "الرجاء كتابة سبب الرفض أولاً"
                        : "Please specify a reason first",
                    );
                    return;
                  }
                  setIsRejectOpen(false);
                  const isPendingApproval = order.status === "PENDING_APPROVAL";
                  await handleStatusChange(
                    isPendingApproval ? "REJECTED" : "CANCELLED",
                    rejectReasonText,
                  );
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-lg transition-all"
              >
                {isAr ? "تأكيد الرفض والإلغاء" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={async () => {
          await confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        isPending={updating}
      />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black">
              {isAr ? `الطلب #${order.id}` : `Order #${order.id}`}
            </h2>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Icons.Calendar className="w-4 h-4" />{" "}
            {format(new Date(order.date), "dd MMMM yyyy")}
            <span className="text-border">|</span>
            <Icons.User className="w-4 h-4" /> {order.customer?.name}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setIsScaleModalOpen(true)}
            className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Scale className="w-4 h-4" />
            {isAr
              ? "أوزان الخلط المستخدمة بشكل فعلي (PLC Scale Weights)"
              : "Actual PLC Scale Weights"}
          </button>

          {canManage &&
            order.status !== "CANCELED" &&
            order.status !== "CANCELLED" &&
            order.status !== "REJECTED" &&
            order.status !== "DELIVERED" && (
              <div className="flex gap-2">
                {order.status === "PENDING_APPROVAL" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("APPROVED")}
                      disabled={updating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                      {isAr ? "موافقة واعتماد" : "Approve Order"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectReasonText("");
                        setIsRejectOpen(true);
                      }}
                      disabled={updating}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                      {isAr ? "رفض الطلب" : "Reject Order"}
                    </button>
                  </>
                )}
                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange("PRODUCTION")}
                    disabled={updating}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-all"
                  >
                    {isAr ? "بدء الإنتاج" : "Start Production"}
                  </button>
                )}
                {order.status === "PRODUCTION" && (
                  <button
                    onClick={() => handleStatusChange("DISPATCHED")}
                    disabled={updating}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold text-sm hover:bg-purple-600 transition-all"
                  >
                    {isAr ? "إرسال الشاحنات" : "Dispatch Trucks"}
                  </button>
                )}
                {order.status === "DISPATCHED" && (
                  <button
                    onClick={() => handleStatusChange("DELIVERED")}
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-all"
                  >
                    {isAr ? "تعيين كمستلم" : "Mark Delivered"}
                  </button>
                )}
                {order.status !== "PENDING_APPROVAL" && (
                  <button
                    onClick={() => {
                      setRejectReasonText("");
                      setIsRejectOpen(true);
                    }}
                    disabled={updating}
                    className="px-4 py-2 border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-lg font-bold text-sm transition-all"
                  >
                    {isAr ? "إلغاء الطلب" : "Cancel Order"}
                  </button>
                )}
                {![
                  "PRODUCTION",
                  "DISPATCHED",
                  "DELIVERED",
                  "COMPLETED",
                  "IN_PROGRESS",
                ].includes(order.status) && (
                  <button
                    onClick={handleDelete}
                    disabled={updating}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isAr ? "حذف الطلب نهائياً" : "Delete Permanently"}
                  </button>
                )}
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INFO CARD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icons.FileText className="w-5 h-5 text-primary" />{" "}
              {isAr ? "معلومات الطلب" : "Order Information"}
            </h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "المشروع" : "Project"}
                </div>
                <div className="font-medium">{order.project?.name}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "الكمية" : "Volume"}
                </div>
                <div className="font-mono font-bold text-lg">
                  {order.volume} m³
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "تاريخ الطلب (الإنشاء)" : "Order Created Date"}
                </div>
                <div className="font-medium text-slate-300">
                  {format(new Date(order.createdAt), "dd/MM/yyyy")}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "تاريخ الصب المطلوب" : "Pouring Date"}
                </div>
                <div className="font-mono font-bold text-indigo-400">
                  {format(new Date(order.date), "dd/MM/yyyy")}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "تصميم الخلطة" : "Mix Design"}
                </div>
                <div className="font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                  {order.mixDesign?.code}
                </div>
                <div className="text-sm font-bold text-muted-foreground mt-1">
                  {order.mixDesign?.name}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase">
                  {isAr ? "صنف المقاومة" : "Strength Class"}
                </div>
                <div className="font-medium">
                  {order.mixDesign?.strengthClass || "N/A"}
                </div>
              </div>
              {approvedEta && (
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase">
                    {isAr ? "وقت وصول الخلاط المطلوب" : "Requested Mixer ETA"}
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    {approvedEta}
                  </div>
                </div>
              )}
              {siteAddress && (
                <div className="col-span-2 border-t border-white/5 pt-3">
                  <div className="text-sm font-bold text-muted-foreground uppercase">
                    {isAr ? "العنوان الوصفي للموقع" : "Descriptive Address"}
                  </div>
                  <div className="font-medium text-slate-200 mt-1">
                    {siteAddress}
                  </div>
                </div>
              )}
              {gpsCoords && (
                <div className="col-span-1 border-t border-white/5 pt-3">
                  <div className="text-sm font-bold text-muted-foreground uppercase">
                    {isAr ? "الموقع الجغرافي (GPS)" : "GPS Coordinates"}
                  </div>
                  <div className="font-medium text-slate-200 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gpsCoords)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-mono text-sm underline"
                    >
                      {gpsCoords}
                    </a>
                  </div>
                </div>
              )}
              {fileAttachment && (
                <div className="col-span-1 border-t border-white/5 pt-3">
                  <div className="text-sm font-bold text-muted-foreground uppercase">
                    {isAr ? "مستند/صورة الموقع" : "Location File"}
                  </div>
                  <div className="font-medium text-slate-200 mt-1 flex items-center gap-1.5">
                    <Icons.FileText className="w-4 h-4 text-indigo-400" />
                    <a
                      href={fileAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                    >
                      {isAr ? "عرض مستند الموقع" : "View Location Document"}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LAB RESULTS */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Icons.Beaker className="w-5 h-5 text-purple-500" />{" "}
                {isAr ? "النتائج المخبرية" : "Lab Results"}
              </h3>
              <button
                onClick={() => router.push("/system/lab/cube-results")}
                className="text-sm font-bold text-primary hover:underline"
              >
                {isAr ? "عرض كافة البيانات المخبرية" : "View All Lab Data"}
              </button>
            </div>

            {order.cubeTests?.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground text-sm font-medium">
                  {isAr
                    ? "لا توجد نتائج فحص نماذج خرسانية مسجلة حتى الآن."
                    : "No cube tests recorded yet."}
                </p>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {isAr
                    ? "يتم أخذ العينات عادة أثناء عملية الصب."
                    : "Samples are typically taken during pouring."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {order.cubeTests.map((test: any) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 font-bold text-sm">
                      <span className="w-8 h-8 rounded-full bg-background border flex items-center justify-center font-bold text-sm">
                        {test.age}d
                      </span>
                      <div>
                        <div className="font-bold text-sm">{test.mpa} MPa</div>
                        <div className="text-sm font-bold text-slate-500">
                          {isAr ? "القوة: " : "Force: "} {test.kn} kN
                        </div>
                      </div>
                    </div>
                    <div>
                      {test.result === "PASS" ? (
                        <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                          {isAr ? "ناجح" : "PASS"}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                          {isAr ? "راسب" : "FAIL"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        <div className="lg:col-span-1">
          <div className="bg-muted/10 border border-border rounded-xl p-6">
            <h3 className="font-bold text-sm uppercase text-slate-400 mb-4">
              {isAr ? "مخطط حالة الطلب" : "Status Timeline"}
            </h3>

            {/* Prominent Current Status Banner */}
            <div className="mb-6 p-4 rounded-xl border bg-slate-900/50 border-slate-800">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {isAr ? "الحالة الحالية للطلب:" : "Current Order Status:"}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-black uppercase border flex items-center gap-1.5 shadow-md",
                    order.status === "SUBMITTED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : order.status === "LAB_APPROVED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : order.status === "PENDING"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : order.status === "PRODUCTION"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                            : order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      order.status === "SUBMITTED"
                        ? "bg-amber-500"
                        : order.status === "LAB_APPROVED"
                          ? "bg-emerald-500"
                          : order.status === "PENDING"
                            ? "bg-blue-500"
                            : order.status === "PRODUCTION"
                              ? "bg-amber-500 animate-ping"
                              : order.status === "DELIVERED"
                                ? "bg-emerald-500"
                                : "bg-slate-500",
                    )}
                  />
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* If pending lab approval, show warning/explanation */}
              {order.status === "SUBMITTED" && (
                <p className="text-xs text-amber-400/80 mt-2.5 font-medium leading-relaxed">
                  ⚠️{" "}
                  {isAr
                    ? "الطلب متوقف حالياً وبانتظار مراجعة واعتماد المختبر المركزي للخلطة التصميمية قبل البدء بالإنتاج."
                    : "The order is currently paused, waiting for the central lab to review and approve the mix design before production starts."}
                </p>
              )}
            </div>

            <div className="space-y-6 relative ml-2">
              {/* Vertical Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border/50"></div>

              {(() => {
                const flow = [...STATUS_FLOW];
                if (
                  order.status === "CANCELED" ||
                  order.status === "CANCELLED"
                ) {
                  flow.push(order.status);
                }

                return flow.map((status, i) => {
                  // Map intermediate statuses to their main milestones in the timeline
                  const effectiveStatus =
                    order.status === "SUBMITTED"
                      ? "APPROVED"
                      : order.status === "PENDING"
                        ? "LAB_APPROVED"
                        : order.status;

                  const isCurrent =
                    status === order.status ||
                    (status === "APPROVED" && order.status === "SUBMITTED") ||
                    (status === "LAB_APPROVED" && order.status === "PENDING");

                  const isPast = flow.indexOf(effectiveStatus) > i;
                  const isFuture = !isCurrent && !isPast;

                  return (
                    <div
                      key={status}
                      className={cn(
                        "relative flex items-center gap-3",
                        isFuture && "opacity-40",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 z-10",
                          isCurrent
                            ? status === "CANCELED" || status === "CANCELLED"
                              ? "bg-rose-500 border-rose-500 animate-pulse"
                              : "bg-primary border-primary"
                            : isPast
                              ? "bg-primary border-primary"
                              : "bg-background border-muted-foreground",
                        )}
                      />
                      <div className="text-sm font-bold">
                        {getStatusLabel(status)}
                        {isCurrent && (
                          <span className="ml-2 text-sm font-bold text-primary bg-primary/10 px-1.5 rounded">
                            {isAr ? "الحالي" : "CURRENT"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <ActualBatchWeightsModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        orderNumber={String(order.id)}
        mixCode={order.mixDesign?.code}
        batches={order.batches || []}
      />
    </div>
  );
}
