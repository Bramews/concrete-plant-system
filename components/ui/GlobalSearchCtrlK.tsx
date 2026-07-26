"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Activity,
  Wrench,
  Settings,
  Navigation,
  CornerDownLeft,
  X,
} from "lucide-react";
import { BidiText } from "@/components/ui/BidiText";

interface SearchItem {
  id: string;
  title: string;
  category: "PAGES" | "ORDERS" | "FAULTS" | "INVOICES";
  url: string;
  details?: string;
  badge?: string;
}

export function GlobalSearchCtrlK() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Static searchable database list + quick routes
  const items: SearchItem[] = useMemo(
    () => [
      // Pages Navigation
      {
        id: "p1",
        title: "لوحة تحكم المشغل (Cockpit)",
        category: "PAGES",
        url: "/system/operator",
        details: "مركز تحكم المحطة الرئيسي ومراقبة الخلاطات",
      },
      {
        id: "p2",
        title: "مختبر الخرسانة والجودة",
        category: "PAGES",
        url: "/system/lab",
        details: "فحوصات الركام وتكسير المكعبات واعتمادات الخلطات",
      },
      {
        id: "p3",
        title: "بوابة المراقبة والحراسة والأمن",
        category: "PAGES",
        url: "/system/guard",
        details: "بوابة دخول الشاحنات وفحص السلامة وحوادث الموقع",
      },
      {
        id: "p4",
        title: "الإدارة والتحليلات الذكية",
        category: "PAGES",
        url: "/system/manager/dashboard",
        details: "متابعة الإنتاج والأرباح والتكاليف المباشرة للمدير",
      },
      {
        id: "p5",
        title: "الحسابات والتقارير المالية",
        category: "PAGES",
        url: "/system/accountant",
        details: "الفواتير والأجور وكشوف المرتبات ونقطة التعادل",
      },
      {
        id: "p6",
        title: "المبيعات وإدارة علاقات العملاء CRM",
        category: "PAGES",
        url: "/system/sales/orders",
        details: "عروض الأسعار والعملاء والفرص البيعية النشطة",
      },
      {
        id: "p7",
        title: "إعدادات النظام العامة والشركات",
        category: "PAGES",
        url: "/system/settings",
        details: "إدارة المستخدمين ومخازن المواد وصلاحيات الوصول",
      },

      // Simulated Database Items (Orders, Invoices, Faults)
      {
        id: "o1",
        title: "طلبية خرسانة C30/37 - مشروع الأبراج السكنية",
        category: "ORDERS",
        url: "/system/orders",
        details: "الكمية المتبقية: 150 م³ - العميل: مقاولات الشرق",
        badge: "نشطة",
      },
      {
        id: "o2",
        title: "طلبية خرسانة C40/50 - أساسات الجسر السريع",
        category: "ORDERS",
        url: "/system/orders",
        details: "الكمية المتبقية: 80 م³ - العميل: شركة الطرق الوطنية",
        badge: "قيد الإنتاج",
      },
      {
        id: "o3",
        title: "طلبية خرسانة C25/30 - عمارة المنصور",
        category: "ORDERS",
        url: "/system/orders",
        details: "الكمية المتبقية: 25 م³ - العميل: المهندس أحمد",
        badge: "مكتملة",
      },

      {
        id: "f1",
        title: "عطل الخلاطة المركزية الكبيرة 2",
        category: "FAULTS",
        url: "/system/operator",
        details: "ارتفاع حرارة المحرك الرئيسي - الخطورة 4/5",
        badge: "مفتوح",
      },
      {
        id: "f2",
        title: "معايرة ميزان صومعة الإسمنت 1",
        category: "FAULTS",
        url: "/system/lab/tools",
        details: "الانتهاء: بعد 5 أيام - المعاير: الهيئة الوطنية",
        badge: "تحذير",
      },

      {
        id: "i1",
        title: "فاتورة المقاول الحديث رقم #INV-2026-89",
        category: "INVOICES",
        url: "/system/accountant",
        details: "القيمة: 12,500,000 د.ع - تاريخ الاستحقاق: 30 يونيو 2026",
        badge: "مستحقة",
      },
      {
        id: "i2",
        title: "فاتورة شركة الرافدين للبناء #INV-2026-90",
        category: "INVOICES",
        url: "/system/accountant",
        details: "القيمة: 8,750,000 د.ع - حالة السداد: غير مدفوعة",
        badge: "متأخرة",
      },
    ],
    [],
  );

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query) return items.slice(0, 5); // Default list when empty
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.details?.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    );
  }, [items, query]);

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setQuery("");
    router.push(item.url);
  };

  // Handle keyboard Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PAGES":
        return <Navigation className="w-4 h-4 text-sky-400" />;
      case "ORDERS":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case "FAULTS":
        return <Wrench className="w-4 h-4 text-rose-400" />;
      case "INVOICES":
      default:
        return <Activity className="w-4 h-4 text-amber-400" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "PAGES":
        return "الصفحات والروابط";
      case "ORDERS":
        return "طلبيات الخرسانة";
      case "FAULTS":
        return "صيانة ومعدات";
      case "INVOICES":
      default:
        return "الفواتير والمالية";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center p-4 pt-[15vh]"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Search dialog */}
      <div className="relative bg-slate-900/90 rounded-[2rem] border border-white/10 w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh] animate-in zoom-in-95 duration-200">
        {/* Input box */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ابحث عن أي شيء في المحطة... (Ctrl+K)"
            className="w-full bg-transparent border-none outline-none text-white text-md placeholder-slate-500 text-right"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-bold text-sm">
              لا توجد نتائج مطابقة لبحثك.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-indigo-600/20 border border-indigo-500/20"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-white/5 rounded-xl text-slate-400">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="space-y-0.5 text-right min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              item.badge === "نشطة" ||
                              item.badge === "قيد الإنتاج"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : item.badge === "تحذير" ||
                                    item.badge === "متأخرة"
                                  ? "bg-rose-500/10 text-rose-400 animate-pulse"
                                  : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.details && (
                        <p className="text-xs text-slate-400 font-bold truncate">
                          <BidiText>{item.details}</BidiText>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-lg">
                      {getCategoryName(item.category)}
                    </span>
                    {isSelected && (
                      <div className="text-slate-400 p-1 bg-white/5 rounded-lg flex items-center justify-center">
                        <CornerDownLeft size={12} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-black/20 border-t border-white/5 px-4 py-3 flex justify-between items-center text-[10px] text-slate-500 font-bold">
          <span>الصحفة الفعالة: اضغط Enter للتنقل السريع</span>
          <div className="flex gap-3">
            <span>
              <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">
                ↑↓
              </kbd>{" "}
              للتنقل
            </span>
            <span>
              <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">
                Esc
              </kbd>{" "}
              للخروج
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
