"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Command,
  ShoppingCart,
  Users,
  Truck,
  Beaker,
  Settings,
  X,
  Loader2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearch, SearchResult } from "@/app/actions/global-search";
import { useRouter } from "next/navigation";

/**
 * CommandPalette Component
 * Global Cmd+K Search & Navigation Hub
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 1. Keyboard Listeners (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // 2. Focus Management
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // 3. Search Logic (Debounced)
  useEffect(() => {
    if (!query || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await globalSearch(query);
      setResults(res);
      setLoading(false);
      setSelectedIndex(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 4. Navigation Handler
  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingCart className="w-4 h-4" />;
      case "CUSTOMER":
        return <Users className="w-4 h-4" />;
      case "PROJECT":
        return <Truck className="w-4 h-4" />;
      case "MATERIAL":
        return <Beaker className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Header: Search Input */}
            <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن طلبات، عملاء، أو تذاكر فحص... (Cmd+K)"
                className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-lg dir-rtl text-right"
                dir="rtl"
              />
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-sm font-bold font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500">
                    Esc
                  </kbd>
                </div>
              )}
            </div>

            {/* Content: Results */}
            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((res, i) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => navigate(res.href)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedIndex === i
                          ? "bg-primary/10 text-primary"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${selectedIndex === i ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-800"}`}
                        >
                          {getTypeIcon(res.type)}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{res.title}</p>
                          {res.subtitle && (
                            <p className="text-sm font-bold opacity-70">
                              {res.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.badge && (
                          <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase font-bold tracking-wider">
                            {res.badge}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length > 1 ? (
                <div className="py-12 text-center text-slate-400">
                  <p>لا توجد نتائج مطابقة لـ &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
                    الوصول السريع
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        title: "مركز المختبر",
                        href: "/system/lab",
                        icon: <Beaker className="w-4 h-4" />,
                      },
                      {
                        title: "المبيعات",
                        href: "/system/orders",
                        icon: <ShoppingCart className="w-4 h-4" />,
                      },
                      {
                        title: "سجل النشاطات",
                        href: "/system/admin/audit-logs",
                        icon: <Activity className="w-4 h-4" />,
                      },
                      {
                        title: "الإعدادات",
                        href: "/system/settings",
                        icon: <Settings className="w-4 h-4" />,
                      },
                    ].map((item) => (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        {item.icon}
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-sm font-bold text-slate-400 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    Enter
                  </kbd>{" "}
                  للاختيار
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    ↑↓
                  </kbd>{" "}
                  للتنقل
                </span>
              </div>
              <div>نظام الإدارة المركزي الحديث</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
