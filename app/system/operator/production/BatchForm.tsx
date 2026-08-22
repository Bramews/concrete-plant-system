"use client";


import { useState, useMemo } from "react";
import { createBatch } from "@/app/actions/production";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Order, MixDesign, Customer, Project, Material } from "@prisma/client";
import {
  Truck,
  User as UserIcon,
  Activity,
  Database,
  ClipboardCheck,
  Play,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Locale, getDictionary } from "@/lib/dictionary";
import { BidiText } from "@/components/ui/BidiText";
import { UnifiedSiloDisplay } from "@/components/operator/UnifiedSiloDisplay";

interface OrderWithDetails extends Order {
  customer?: Customer | null;
  project?: Project | null;
  mixDesign?: MixDesign | null;
  approval?: { mixData?: string | null } | null;
}

interface BatchFormProps {
  orders: OrderWithDetails[];
  materials: Material[];
  lang: Locale;
}



export default function BatchForm({ orders, materials, lang }: BatchFormProps) {
  const dict = getDictionary(lang);
  const [selectedOrderId, setSelectedOrderId] = useState(
    orders[0]?.id?.toString() || "",
  );
  const [quantity, setQuantity] = useState(6);
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(false);


  const selectedOrder = orders.find(
    (o: OrderWithDetails) => o.id.toString() === selectedOrderId,
  );

  const approvedEta = useMemo(() => {
    if (!selectedOrder?.approval?.mixData) return "";
    try {
      const data = JSON.parse(selectedOrder.approval.mixData);
      return data.eta || "";
    } catch {
      return "";
    }
  }, [selectedOrder]);

  // Parse mix ingredients from approval data
  const ingredients = useMemo(() => {
    if (!selectedOrder?.approval?.mixData) return [];
    try {
      const approvalData = JSON.parse(selectedOrder.approval.mixData);
      const proportions = approvalData.proportions || {};
      return Object.entries(proportions).map(([name, amount]) => ({
        name,
        amount: Number(amount),
        unit: "kg",
      }));
    } catch {
      console.error("Parse error");
      return [];
    }
  }, [selectedOrder]);

  const handleBatch = async () => {
    if (!selectedOrderId) {
      toast.error("يرجى اختيار الطلب المراد إنتاجه أولاً.");
      return;
    }
    if (!truckNumber.trim() || !driverName.trim()) {
      toast.error("يرجى تعبئة اسم السائق ورقم الشاحنة قبل بدء الإنتاج.");
      return;
    }
    if (quantity <= 0) {
      toast.error("يرجى تحديد كمية إنتاج صالحة.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("orderId", selectedOrderId);
    formData.append("quantity", quantity.toString());
    formData.append("truckNumber", truckNumber.trim());
    formData.append("driverName", driverName.trim());
    formData.append("requestId", `BATCH-${Date.now()}`);

    try {
      await createBatch(formData);
      toast.success(
        dict.operator?.success_msg || "تم بدء الإنتاج وتوليد تذكرة الصب بنجاح",
      );
      setTruckNumber("");
      setDriverName("");
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : String(err);

      // Translate known validation and server errors to user-friendly Arabic
      if (
        errorMessage.includes("VALIDATION_ERROR") ||
        errorMessage.includes("too_small") ||
        errorMessage.includes("truckNumber") ||
        errorMessage.includes("driverName")
      ) {
        errorMessage =
          "يرجى التأكد من إدخال اسم السائق ورقم الشاحنة والكمية بشكل صحيح.";
      } else if (errorMessage.includes("CONCURRENCY_ERROR")) {
        errorMessage =
          "هذا الطلب يتلقى معالجة من مشغل آخر حالياً. يرجى المحاولة بعد لحظات.";
      } else if (
        errorMessage.includes("Transaction API error") ||
        errorMessage.includes("Transaction already closed") ||
        errorMessage.includes("prisma") ||
        errorMessage.includes("invocation")
      ) {
        errorMessage =
          "حدث إبطاء مؤقت في الاتصال بقاعدة البيانات. تم إلغاء العملية لحماية البيانات، يرجى محاولة بدء الإنتاج مجدداً.";
      } else if (errorMessage.includes("Order must be approved")) {
        errorMessage = "لا يمكن الصب: يجب اعتماد الطلب من قبل المختبر أولاً.";
      } else if (errorMessage.includes("Unauthorized")) {
        errorMessage = "غير مصرح لك بإجراء عملية الإنتاج.";
      } else if (errorMessage.includes("Order not found")) {
        errorMessage = "الطلب غير موجود أو تم إلغاؤه.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Status & Silos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 op-card p-6 flex flex-col justify-between overflow-hidden relative border-l-4 border-blue-500">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Settings size={120} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Database className="text-blue-500" />
                {dict.operator?.inventory_status || "حالة المخزون الحي"}
              </h3>
              <p className="text-sm font-bold text-slate-400">
                {dict.operator?.auto_sync || "تحديث تلقائي من الميزان"}
              </p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-emerald-500/20">
              <Activity size={12} /> {dict.operator.status_online}
            </div>
          </div>

          <div className="pt-4">
            <UnifiedSiloDisplay materials={materials.slice(0, 5)} compact={true} className="bg-transparent border-0 p-0 shadow-none" />
          </div>
        </div>

        <div className="op-card p-6 border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ClipboardCheck className="text-yellow-500" />
            {dict.operator.active_order}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-400 block mb-1">
                {dict.operator.select_order}
              </label>
              <select
                id="order-select"
                title={dict.operator.select_order}
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-slate-800 transition-all text-sm font-bold"
              >
                {orders.map((o: OrderWithDetails) => (
                  <option key={o.id} value={o.id} className="bg-slate-900">
                    #{o.orderNumber} - {o.customer?.name}
                  </option>
                ))}
                {orders.length === 0 && (
                  <option value="">{dict.operator.no_orders}</option>
                )}
              </select>
            </div>

            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3"
              >
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-sm font-bold text-slate-400">
                    {dict.operator.project}
                  </span>
                  <span className="text-sm font-bold">
                    {selectedOrder.project?.name || "---"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-sm font-bold text-slate-400">
                    {dict.operator.mix_code}
                  </span>
                  <span className="text-sm font-bold text-yellow-500">
                    {selectedOrder.mixDesign?.code || "---"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-sm font-bold text-slate-400">
                    {dict.operator.total_vol}
                  </span>
                  <BidiText className="text-sm font-bold">
                    {selectedOrder.volume} م³
                  </BidiText>
                </div>
                {approvedEta && (
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-slate-400">
                      وقت وصول الخلاط
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {approvedEta}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 op-card p-6 overflow-hidden">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Play className="text-blue-500 fill-current" />
            {dict.operator.batching_control}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="quantity-input"
                className="text-sm font-bold text-slate-400 flex items-center gap-1"
              >
                <Activity size={14} />
                {dict.operator.target_vol}
              </label>
              <input
                id="quantity-input"
                title={dict.operator.target_vol}
                type="number"
                value={quantity}
                dir="ltr"
                onChange={(e) => setQuantity(Number(e.target.value))}
                max={12}
                min={1}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-2xl font-black font-mono text-center focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="truck-input"
                className="text-sm font-bold text-slate-400 flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <Truck size={14} />
                  {dict.operator.truck_no}
                </span>
                {!truckNumber.trim() && (
                  <span className="text-[11px] font-bold text-rose-400">
                    مطلوب
                  </span>
                )}
              </label>
              <input
                id="truck-input"
                title={dict.operator.truck_no}
                type="text"
                placeholder="مثال: T-102"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-xl p-4 text-2xl font-black font-mono text-center focus:ring-4 outline-none transition-all uppercase placeholder:text-slate-600 placeholder:font-normal ${
                  !truckNumber.trim()
                    ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="driver-input"
                className="text-sm font-bold text-slate-400 flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <UserIcon size={14} />
                  {dict.operator.driver_name}
                </span>
                {!driverName.trim() && (
                  <span className="text-[11px] font-bold text-rose-400">
                    مطلوب
                  </span>
                )}
              </label>
              <input
                id="driver-input"
                title={dict.operator.driver_name}
                type="text"
                placeholder="أدخل اسم السائق الرباعي..."
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-xl p-4 text-xl font-bold text-center focus:ring-4 outline-none transition-all placeholder:text-slate-600 placeholder:font-normal ${
                  !driverName.trim()
                    ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>
          </div>

          {/* ملخص ما قبل الإنتاج */}
          {selectedOrder && truckNumber.trim() && driverName.trim() && quantity > 0 && (
            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الخلطة</p>
                <p className="text-lg font-black text-cyan-400 font-mono">{selectedOrder.mixDesign?.code || "---"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الكمية</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">{quantity} <span className="text-sm">م³</span></p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الشاحنة</p>
                <p className="text-lg font-black text-amber-400 font-mono uppercase">{truckNumber}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleBatch}
              disabled={
                loading ||
                !selectedOrderId ||
                !truckNumber.trim() ||
                !driverName.trim() ||
                quantity <= 0
              }
              className={`
                w-full py-6 rounded-2xl font-black text-xl tracking-wide
                flex items-center justify-center gap-3
                transition-all duration-300 relative overflow-hidden
                ${loading
                  ? "bg-slate-800 text-slate-400 cursor-wait shadow-none"
                  : "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white cursor-pointer"
                }
                ${!loading && "hover:from-emerald-500 hover:to-cyan-500"}
                ${!loading && "shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)]"}
                border border-emerald-500/20
                disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
              `}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center items-center gap-3"
                  >
                    <Activity className="animate-spin" />
                    جاري تنفيذ دفعة الخلط...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center items-center gap-3"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    ابدأ دفعة الخلط الآن
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>
        </div>

        <div className="op-card p-6 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-blue-400" />
            <h4 className="font-bold text-sm tracking-widest">
              {dict.operator.mix_analysis}
            </h4>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing) => {
              const translatedName =
                ing.name === "Cement"
                  ? "أسمنت"
                  : ing.name === "NaturalSand"
                    ? "رمل طبيعي"
                    : ing.name === "CrushedSand"
                      ? "رمل مغسول"
                      : ing.name === "Gravel" || ing.name === "Aggregates"
                        ? "حصى وركام"
                        : ing.name === "Water"
                          ? "ماء خلط"
                          : ing.name === "Admixture"
                            ? "إضافات كيميائية"
                            : ing.name;

              return (
                <div
                  key={ing.name}
                  className="flex justify-between items-center text-sm font-bold group"
                >
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    {translatedName}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white font-bold">
                      {Number(
                        (ing.amount * quantity).toFixed(1),
                      ).toLocaleString("en-US")}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      كغم
                    </span>
                  </div>
                </div>
              );
            })}
            {ingredients.length === 0 && (
              <p className="text-sm font-bold text-slate-500 italic py-4">
                {dict.operator.select_order_view}
              </p>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/5">
            <div className="flex gap-2 items-center text-sm text-blue-400 font-bold">
              <ClipboardCheck size={12} />
              {dict.operator.lab_verified}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
