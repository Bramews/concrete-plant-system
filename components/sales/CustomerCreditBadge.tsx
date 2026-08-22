"use client";

import React, { useState, useEffect, useRef } from "react";
import { checkCustomerCreditStatus, CreditStatusResult } from "@/app/actions/finance";
import { ShieldCheck, AlertTriangle, Clock, Info, X, DollarSign, Ban } from "lucide-react";

interface CustomerCreditBadgeProps {
  companyId?: number;
  customerId?: number;
  customerName?: string;
  orderVolume?: number;
  unitPrice?: number;
}

export function CustomerCreditBadge({
  companyId = 1,
  customerId,
  customerName,
  orderVolume = 0,
  unitPrice = 250,
}: CustomerCreditBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CreditStatusResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerId || customerId <= 0) {
      setStatus(null);
      return;
    }

    let active = true;
    const estimatedVal = (orderVolume || 0) * (unitPrice || 250);

    setLoading(true);
    checkCustomerCreditStatus(companyId, customerId, estimatedVal)
      .then((res) => {
        if (active) {
          setStatus(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyId, customerId, orderVolume, unitPrice]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!customerId || !status) {
    return null;
  }

  const getBadgeStyle = () => {
    switch (status.statusType) {
      case "OVERDUE":
        return {
          bg: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30",
          icon: <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          label: `متأخرات (${status.overdueCount})`,
          headerColor: "text-rose-400",
          title: "حساب معلق - فواتير متأخرة",
        };
      case "LIMIT_EXCEEDED":
        return {
          bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          label: "تجاوز السقف",
          headerColor: "text-amber-400",
          title: "تجاوز سقف الائتمان",
        };
      case "HEALTHY":
        return {
          bg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          label: "حساب سليم",
          headerColor: "text-emerald-400",
          title: "حساب ائتماني منتظم",
        };
      case "OPEN":
      default:
        return {
          bg: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          label: "ائتمان مفتوح",
          headerColor: "text-blue-400",
          title: "عميل بائتمان مفتوح",
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="relative inline-block text-right" ref={popoverRef} dir="rtl">
      {/* Badge Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${badge.bg}`}
        title="انقر لعرض الموقف المالي وملاحظات المبيعات"
      >
        {badge.icon}
        <span>{badge.label}</span>
        <Info className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity" />
      </button>

      {/* Information Popover Card */}
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 right-0 w-80 p-4 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-right">
          <div className="flex justify-between items-start border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black ${badge.headerColor}`}>
                {badge.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {customerName && (
              <div className="flex justify-between">
                <span className="text-slate-400">العميل:</span>
                <span className="font-bold text-white">{customerName}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-400">الرصيد القائم الحالي:</span>
              <span className="font-mono font-bold text-slate-200">
                {status.outstandingBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">سقف الائتمان:</span>
              <span className="font-mono font-bold text-slate-200">
                {status.creditLimit > 0
                  ? `${status.creditLimit.toLocaleString()}`
                  : "مفتوح (غير مقيد)"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">الفواتير المتأخرة:</span>
              <span
                className={`font-mono font-bold ${
                  status.overdueCount > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {status.overdueCount > 0 ? `${status.overdueCount} فاتورة` : "لا توجد"}
              </span>
            </div>

            {/* Explanation Note for Sales */}
            <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">
                توجيه للمبيعات:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {status.reason ||
                  (status.statusType === "OPEN"
                    ? "العميل يتمتع بائتمان مفتوح ولا توجد عليه أي قيود أو فواتير متأخرة."
                    : "حساب العميل منتظم وضمن الحدود الائتمانية المقبولة.")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
