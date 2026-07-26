"use client";

import Link from "next/link";
import MixStatusBadge from "./MixStatusBadge";
import { format } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Icons } from "./../ui/Icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";

interface MixDesignsDict {
  title: string;
  create_btn: string;
  no_mixes: string;
  table: {
    code: string;
    name: string;
    strength: string;
    status: string;
    date: string;
    version: string;
    actions: string;
  };
  actions: {
    edit: string;
    view: string;
    freeze: string;
    unfreeze: string;
    restore: string;
    delete_perm: string;
  };
  history: {
    title: string;
    note: string;
  };
}

export default function MixTable({
  mixes,
  dict,
  lang,
  isArchive,
  userRole,
}: {
  mixes: {
    id: number;
    code: string;
    name: string;
    strengthClass: string | null; // Changed from grade to strengthClass
    status: string;
    updatedAt: string | Date;
    createdAt?: string | Date;
    version?: number; // Added version
    isFrozen?: boolean; // Added isFrozen

    history?: {
      id: number;
      version: number;
      status: string;
      changeNote?: string | null;
      updatedAt: Date;
    }[];
    _count?: {
      orders: number;
      revisions?: number;
    };
  }[];
  dict: MixDesignsDict;
  lang: string;
  isArchive?: boolean;
  userRole?: string;
}) {
  const [localMixes, setLocalMixes] = useState(mixes);

  useEffect(() => {
    setLocalMixes(mixes);
  }, [mixes]);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "newest" | "oldest">(
    "default",
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const uniqueGrades = useMemo(() => {
    const grades = mixes
      .map((m) => m.strengthClass)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(grades));
  }, [mixes]);

  const isAnyFilterActive =
    statusFilter !== "ALL" ||
    gradeFilter !== "ALL" ||
    dateFilter !== "ALL" ||
    sortOrder !== "default";

  const handleRefresh = () => {
    setSearchQuery("");
    setSortOrder("default");
    setStatusFilter("ALL");
    setGradeFilter("ALL");
    setDateFilter("ALL");
    router.refresh();
    toast.success(
      lang === "ar"
        ? "تم تحديث البيانات وتصفير الفلاتر"
        : "Data refreshed and filters cleared",
    );
  };

  const filteredAndSortedMixes = useMemo(() => {
    return localMixes
      .filter((mix) => {
        // 1. Search Query
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          mix.name.toLowerCase().includes(query) ||
          mix.code.toLowerCase().includes(query) ||
          (mix.strengthClass &&
            mix.strengthClass.toLowerCase().includes(query));

        // 2. Status Filter
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "FROZEN" && mix.isFrozen) ||
          (statusFilter !== "FROZEN" && mix.status === statusFilter);

        // 3. Grade Filter
        const matchesGrade =
          gradeFilter === "ALL" || mix.strengthClass === gradeFilter;

        // 4. Date Filter
        let matchesDate = true;
        if (dateFilter !== "ALL") {
          const updateDate = new Date(mix.updatedAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - updateDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (dateFilter === "TODAY") {
            matchesDate = diffDays <= 1;
          } else if (dateFilter === "WEEK") {
            matchesDate = diffDays <= 7;
          } else if (dateFilter === "MONTH") {
            matchesDate = diffDays <= 30;
          }
        }

        return matchesSearch && matchesStatus && matchesGrade && matchesDate;
      })
      .sort((a, b) => {
        if (sortOrder === "default") {
          const dateA = new Date(a.createdAt || a.id).getTime();
          const dateB = new Date(b.createdAt || b.id).getTime();
          return dateA - dateB;
        } else {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          if (sortOrder === "oldest") {
            return dateA - dateB;
          } else {
            return dateB - dateA;
          }
        }
      });
  }, [
    localMixes,
    searchQuery,
    sortOrder,
    statusFilter,
    gradeFilter,
    dateFilter,
  ]);

  const [historyModalId, setHistoryModalId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    variant: "danger" | "warning" | "success" | "info";
    requireCheckbox?: boolean;
    checkboxLabel?: string;
    children?: React.ReactNode;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
    action: async () => {},
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryModalId(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);
  const rowVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: 30, scale: 0.96 },
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="border border-white/10 rounded-2xl bg-slate-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative group w-full"
      >
        {/* Search & Actions Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-white/10 bg-slate-900/20 backdrop-blur-md rounded-t-2xl relative z-20">
          {/* Right side: Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              <Icons.Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "بحث برمز أو اسم الخلطة..."
                  : "Search by code or name..."
              }
              className="w-full bg-slate-950/30 border border-white/5 rounded-xl pr-9 pl-9 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 hover:text-white transition-colors"
                title="مسح البحث"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Left side: Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Dynamic Results Counter */}
            {(searchQuery || isAnyFilterActive) && (
              <span className="text-[10px] text-slate-400 font-bold bg-white/5 border border-white/5 px-2.5 py-2 rounded-xl whitespace-nowrap">
                {lang === "ar"
                  ? `${filteredAndSortedMixes.length} خلطة`
                  : `${filteredAndSortedMixes.length} mixes`}
              </span>
            )}

            {/* Filter Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-9 px-3 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs ${
                  isFilterOpen
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : isAnyFilterActive
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-950/30 border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="تصفية النتائج"
              >
                <Icons.Filter className="w-4 h-4" />
                <span>{lang === "ar" ? "تصفية" : "Filter"}</span>
                {isAnyFilterActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -left-0.5 animate-pulse" />
                )}
              </button>

              {/* Filter Dropdown Card */}
              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-4 z-50 space-y-4 text-start"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-slate-200">
                          {lang === "ar" ? "خيارات التصفية" : "Filter Options"}
                        </span>
                        {isAnyFilterActive && (
                          <button
                            onClick={() => {
                              setStatusFilter("ALL");
                              setGradeFilter("ALL");
                              setDateFilter("ALL");
                              setSortOrder("default");
                            }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors"
                          >
                            {lang === "ar" ? "مسح الكل" : "Clear All"}
                          </button>
                        )}
                      </div>

                      {/* Status Custom Select */}
                      <div className="space-y-2">
                        <label className="text-[10.5px] text-slate-400 font-bold block">
                          {lang === "ar" ? "الحالة" : "Status"}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            {
                              value: "ALL",
                              label: lang === "ar" ? "الكل" : "All",
                            },
                            {
                              value: "APPROVED",
                              label: lang === "ar" ? "معتمدة" : "Approved",
                            },
                            {
                              value: "DRAFT",
                              label: lang === "ar" ? "مسودات" : "Drafts",
                            },
                            {
                              value: "FROZEN",
                              label: lang === "ar" ? "مجمدة" : "Frozen",
                            },
                          ].map((opt) => {
                            const active = statusFilter === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                                  active
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Strength Class Custom Select */}
                      <div className="space-y-2">
                        <label className="text-[10.5px] text-slate-400 font-bold block">
                          {lang === "ar" ? "رتبة المقاومة" : "Strength Class"}
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar pr-1">
                          <button
                            type="button"
                            onClick={() => setGradeFilter("ALL")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              gradeFilter === "ALL"
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {lang === "ar" ? "الكل" : "All"}
                          </button>
                          {uniqueGrades.map((grade) => {
                            const active = gradeFilter === grade;
                            return (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => setGradeFilter(grade)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                                  active
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Date Custom Select */}
                      <div className="space-y-2">
                        <label className="text-[10.5px] text-slate-400 font-bold block">
                          {lang === "ar" ? "تاريخ التحديث" : "Date Updated"}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            {
                              value: "ALL",
                              label: lang === "ar" ? "الكل" : "All",
                            },
                            {
                              value: "TODAY",
                              label: lang === "ar" ? "اليوم" : "Today",
                            },
                            {
                              value: "WEEK",
                              label:
                                lang === "ar" ? "آخر 7 أيام" : "Last 7 Days",
                            },
                            {
                              value: "MONTH",
                              label:
                                lang === "ar" ? "آخر 30 يوم" : "Last 30 Days",
                            },
                          ].map((opt) => {
                            const active = dateFilter === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setDateFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                                  active
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sort/Ordering Custom Select */}
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <label className="text-[10.5px] text-slate-400 font-bold block">
                          {lang === "ar" ? "ترتيب النتائج" : "Sort Order"}
                        </label>
                        <div className="flex flex-col gap-1.5">
                          {[
                            {
                              value: "default",
                              label:
                                lang === "ar"
                                  ? "الافتراضي (حسب الإنشاء)"
                                  : "Default (by creation)",
                            },
                            {
                              value: "newest",
                              label:
                                lang === "ar"
                                  ? "الأحدث تعديلاً"
                                  : "Newest modified",
                            },
                            {
                              value: "oldest",
                              label:
                                lang === "ar"
                                  ? "الأقدم تعديلاً"
                                  : "Oldest modified",
                            },
                          ].map((opt) => {
                            const active = sortOrder === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSortOrder(opt.value as any)}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all border text-right flex items-center justify-between ${
                                  active
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {active && (
                                  <Icons.Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="h-9 w-9 rounded-xl border border-white/5 bg-slate-950/30 text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center"
              title="تحديث البيانات وتصفير الفلاتر"
            >
              <Icons.RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Bar */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/20 border-b border-white/10">
            <span className="text-[10px] text-slate-500 font-bold ml-2">
              {lang === "ar" ? "الفلاتر النشطة:" : "Active Filters:"}
            </span>

            {statusFilter !== "ALL" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
                <span>
                  {lang === "ar" ? "الحالة: " : "Status: "}
                  {statusFilter === "APPROVED"
                    ? lang === "ar"
                      ? "معتمدة"
                      : "Approved"
                    : statusFilter === "DRAFT"
                      ? lang === "ar"
                        ? "مسودات"
                        : "Drafts"
                      : statusFilter === "FROZEN"
                        ? lang === "ar"
                          ? "مجمدة"
                          : "Frozen"
                        : statusFilter}
                </span>
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className="hover:text-white transition-colors"
                >
                  <Icons.X className="w-3 h-3" />
                </button>
              </span>
            )}

            {gradeFilter !== "ALL" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
                <span>
                  {lang === "ar" ? "المقاومة: " : "Grade: "}
                  {gradeFilter}
                </span>
                <button
                  onClick={() => setGradeFilter("ALL")}
                  className="hover:text-white transition-colors"
                >
                  <Icons.X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateFilter !== "ALL" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
                <span>
                  {lang === "ar" ? "التحديث: " : "Updated: "}
                  {dateFilter === "TODAY"
                    ? lang === "ar"
                      ? "اليوم"
                      : "Today"
                    : dateFilter === "WEEK"
                      ? lang === "ar"
                        ? "آخر 7 أيام"
                        : "Last 7 Days"
                      : dateFilter === "MONTH"
                        ? lang === "ar"
                          ? "آخر 30 يوم"
                          : "Last 30 Days"
                        : dateFilter}
                </span>
                <button
                  onClick={() => setDateFilter("ALL")}
                  className="hover:text-white transition-colors"
                >
                  <Icons.X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortOrder !== "default" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
                <span>
                  {lang === "ar" ? "الترتيب: " : "Sort: "}
                  {sortOrder === "newest"
                    ? lang === "ar"
                      ? "الأحدث تعديلاً"
                      : "Newest modified"
                    : lang === "ar"
                      ? "الأقدم تعديلاً"
                      : "Oldest modified"}
                </span>
                <button
                  onClick={() => setSortOrder("default")}
                  className="hover:text-white transition-colors"
                >
                  <Icons.X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setStatusFilter("ALL");
                setGradeFilter("ALL");
                setDateFilter("ALL");
                setSortOrder("default");
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors mr-auto"
            >
              {lang === "ar" ? "مسح الكل" : "Clear All"}
            </button>
          </div>
        )}

        {/* Shimmer scan line */}
        <motion.div
          initial={{ x: "-100%", opacity: 0.5 }}
          animate={{ x: "200%", opacity: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10 skew-x-[-20deg]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <ConfirmationDialog
          isOpen={confirmConfig.isOpen}
          onClose={() =>
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
          }
          title={confirmConfig.title}
          description={confirmConfig.description}
          variant={confirmConfig.variant}
          requireCheckbox={confirmConfig.requireCheckbox}
          checkboxLabel={confirmConfig.checkboxLabel}
          onConfirm={async () => {
            await confirmConfig.action();
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          {confirmConfig.children}
        </ConfirmationDialog>
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth p-1 rounded-b-2xl overflow-hidden">
          <table className="w-full text-xs text-start xl:min-w-full min-w-[900px]">
            <thead className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-sm relative z-10">
              <tr className="text-slate-300">
                <th className="px-3 py-4 font-black text-[11px] uppercase tracking-widest border-l border-white/5 w-[5%] text-center bg-white/[0.02] text-slate-200">
                  #
                </th>
                <th className="px-3 py-4 font-black text-[11px] uppercase tracking-widest border-l border-white/5 w-[20%] text-right bg-white/[0.02] text-slate-200">
                  {dict.table.name}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-right text-slate-400">
                  {dict.table.code}
                </th>
                <th className="px-3 py-4 font-black text-[11px] uppercase tracking-widest border-l border-r border-white/5 w-[15%] text-center bg-white/[0.02] text-slate-200">
                  {dict.table.strength}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-center text-slate-400">
                  {dict.table.status}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-center text-slate-400">
                  {dict.table.date}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-center whitespace-nowrap text-slate-400">
                  {dict.table.version}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-center whitespace-nowrap text-slate-400">
                  {dict.actions.edit}
                </th>
                <th className="px-3 py-4 font-black uppercase text-[11px] tracking-widest text-center whitespace-nowrap min-w-[120px] text-slate-400">
                  {dict.table.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedMixes.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-500 font-bold"
                  >
                    {dict.no_mixes}
                  </td>
                </motion.tr>
              ) : (
                <AnimatePresence>
                  {filteredAndSortedMixes.map((mix, index) => (
                    <motion.tr
                      key={mix.id}
                      layout
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{
                        scale: 1.002,
                        backgroundColor: "rgba(99, 102, 241, 0.05)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      }}
                      transition={{
                        delay: index * 0.06,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        layout: { type: "spring", stiffness: 300, damping: 30 },
                      }}
                      className="cursor-default"
                    >
                      <td className="px-3 py-3 border-l border-white/5 text-center bg-white/[0.01] font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 border-l border-white/5 text-right bg-white/[0.01]">
                        <span className="font-black text-slate-100 text-[13px] whitespace-nowrap">
                          {mix.name}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-400/10 border border-indigo-400/20 text-indigo-400 font-mono font-black text-sm tracking-tight shadow-sm whitespace-nowrap">
                          {mix.code}
                        </span>
                      </td>
                      <td className="px-2 py-3 border-l border-r border-white/5 text-center bg-white/[0.01]">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-md text-sm font-bold font-mono min-w-[80px] whitespace-nowrap">
                          {mix.strengthClass}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <MixStatusBadge status={mix.status} />
                          {mix.isFrozen && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {lang === "ar" ? "مجمدة" : "FROZEN"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-slate-400 font-mono text-xs text-center whitespace-nowrap">
                        {format(new Date(mix.updatedAt), "yyyy-MM-dd")}
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        {mix.version && (
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold leading-none shadow-sm">
                              v{mix.version}
                            </span>
                            {(mix as { history?: unknown[] }).history &&
                              ((mix as { history?: unknown[] }).history
                                ?.length ?? 0) > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setHistoryModalId(mix.id);
                                  }}
                                  title={
                                    dict.history?.title ||
                                    (lang === "ar"
                                      ? "عرض سجل الإصدارات"
                                      : "View version history")
                                  }
                                  className="p-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                  <Icons.History className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                        )}
                      </td>

                      {/* Edit Column */}
                      <td className="px-4 py-3 text-center border-l border-white/5 bg-white/[0.01]">
                        {!isArchive &&
                          (mix.status === "DRAFT" ||
                            mix.status === "APPROVED") && (
                            <div className="flex items-center justify-center gap-2">
                              {mix.status === "DRAFT" &&
                              userRole !== "LAB_TECH" &&
                              userRole !== "LAB_TECHNICIAN" ? (
                                <Link
                                  href={`/system/lab/mix-designs/${mix.id}/edit`}
                                  className="h-8 inline-flex items-center justify-center px-4 bg-indigo-500/10 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all duration-300 rounded-lg text-[11px] whitespace-nowrap gap-2 border border-indigo-500/20 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                >
                                  <Icons.Edit className="w-3.5 h-3.5" />
                                  {dict.actions.edit}
                                </Link>
                              ) : (
                                <Link
                                  href={`/system/lab/mix-designs/${mix.id}/view`}
                                  className="h-8 inline-flex items-center justify-center px-4 bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 hover:text-white transition-all duration-300 rounded-lg text-[11px] whitespace-nowrap gap-2 border border-white/5 hover:border-white/10"
                                >
                                  <Icons.Eye className="w-3.5 h-3.5 text-slate-400" />
                                  {dict.actions.view}
                                </Link>
                              )}
                            </div>
                          )}
                      </td>

                      {/* Actions Column - Horizontal Layout Reverted */}
                      <td className="px-2 py-3 text-center min-w-[120px] border-l border-white/10 bg-white/[0.01]">
                        <div className="flex flex-row items-center justify-center gap-2">
                          {userRole !== "LAB_TECH" &&
                            userRole !== "LAB_TECHNICIAN" && (
                              <>
                                {!isArchive &&
                                  (mix.status === "DRAFT" ||
                                    mix.status === "APPROVED") && (
                                    <>
                                      {/* Freeze / Unfreeze Button */}
                                      {(mix as { isFrozen?: boolean })
                                        .isFrozen ? (
                                        <button
                                          onClick={() => {
                                            setConfirmConfig({
                                              isOpen: true,
                                              title:
                                                dict.actions?.unfreeze ||
                                                "Unfreeze",
                                              description:
                                                lang === "ar"
                                                  ? "هل أنت متأكد من فك تجميد هذه الخلطة؟"
                                                  : "Are you sure you want to unfreeze this mix?",
                                              variant: "info",
                                              action: async () => {
                                                const { unfreezeMixDesign } =
                                                  await import(
                                                    "@/app/actions/lab"
                                                  );
                                                await unfreezeMixDesign(mix.id);
                                                toast.success(
                                                  lang === "ar"
                                                    ? "تم فك التجميد"
                                                    : "Unfrozen successfully",
                                                );
                                              },
                                            });
                                          }}
                                          title={
                                            dict.actions?.unfreeze || "Unfreeze"
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white rounded-lg border border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 shrink-0"
                                        >
                                          <Icons.ToggleRight className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setConfirmConfig({
                                              isOpen: true,
                                              title:
                                                dict.actions?.freeze ||
                                                "Freeze",
                                              description:
                                                lang === "ar"
                                                  ? "تجميد الخلطة يمنع التعديل نهائياً. هل تريد الاستمرار؟"
                                                  : "Freezing will prevent editing permanently. Proceed?",
                                              variant: "warning",
                                              action: async () => {
                                                const { freezeMixDesign } =
                                                  await import(
                                                    "@/app/actions/lab"
                                                  );
                                                await freezeMixDesign(mix.id);
                                                toast.success(
                                                  lang === "ar"
                                                    ? "تم التجميد"
                                                    : "Frozen successfully",
                                                );
                                              },
                                            });
                                          }}
                                          title={
                                            dict.actions?.freeze || "Freeze"
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-300 shrink-0"
                                        >
                                          <Icons.ToggleLeft className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Archive Button */}
                                      <button
                                        onClick={() => {
                                          setConfirmConfig({
                                            isOpen: true,
                                            title: "أرشفة",
                                            description:
                                              "سيتم نقل الخلطة للأرشيف. هل أنت متأكد؟",
                                            variant: "warning",
                                            action: async () => {
                                              const { archiveMixDesign } =
                                                await import(
                                                  "@/app/actions/lab"
                                                );
                                              await archiveMixDesign(mix.id);
                                              setLocalMixes((prev) =>
                                                prev.filter(
                                                  (m) => m.id !== mix.id,
                                                ),
                                              );
                                              toast.success("تمت الأرشفة");
                                            },
                                          });
                                        }}
                                        title="أرشفة"
                                        className="w-8 h-8 flex items-center justify-center text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg border border-transparent hover:border-amber-500/20 transition-all duration-300 shrink-0"
                                      >
                                        <Icons.Archive className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                {isArchive && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setConfirmConfig({
                                          isOpen: true,
                                          title:
                                            dict.actions?.restore || "Restore",
                                          description:
                                            lang === "ar"
                                              ? "استعادة الخلطة من الأرشيف؟"
                                              : "Restore this mix from archive?",
                                          variant: "info",
                                          action: async () => {
                                            const { restoreMixDesign } =
                                              await import("@/app/actions/lab");
                                            await restoreMixDesign(mix.id);
                                            setLocalMixes((prev) =>
                                              prev.filter(
                                                (m) => m.id !== mix.id,
                                              ),
                                            );
                                            toast.success(
                                              lang === "ar"
                                                ? "تمت الاستعادة"
                                                : "Restored successfully",
                                            );
                                          },
                                        });
                                      }}
                                      title={dict.actions?.restore || "Restore"}
                                      className="w-8 h-8 flex items-center justify-center text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 shrink-0"
                                    >
                                      <Icons.RefreshCw className="w-4 h-4" />
                                    </button>

                                    {(userRole === "LAB_MANAGER" ||
                                      userRole === "SYSTEM_OWNER" ||
                                      userRole === "COMPANY_ADMIN") && (
                                      <button
                                        onClick={() => {
                                          setConfirmConfig({
                                            isOpen: true,
                                            title:
                                              dict.actions?.delete_perm ||
                                              "Delete Permanently",
                                            description:
                                              lang === "ar"
                                                ? "سيتم حذف الخلطة نهائياً من النظام. هل أنت متأكد؟"
                                                : "Mix will be permanently deleted. Are you sure?",
                                            variant: "danger",
                                            requireCheckbox: true,
                                            checkboxLabel:
                                              lang === "ar"
                                                ? "أؤكد رغبتي في حذف هذه الخلطة نهائياً"
                                                : "I confirm permanent deletion",
                                            children: (
                                              <div className="flex flex-col gap-2">
                                                <a
                                                  href={`/system/orders?mixId=${mix.id}`}
                                                  target="_blank"
                                                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors decoration-indigo-500/30 underline underline-offset-4"
                                                >
                                                  <Icons.ExternalLink className="w-3.5 h-3.5" />
                                                  {lang === "ar"
                                                    ? "عرض الطلبات المرتبطة"
                                                    : "View related orders"}
                                                </a>
                                              </div>
                                            ),
                                            action: async () => {
                                              try {
                                                const {
                                                  deleteMixDesignPermanently,
                                                } = await import(
                                                  "@/app/actions/lab"
                                                );
                                                await deleteMixDesignPermanently(
                                                  mix.id,
                                                );
                                                setLocalMixes((prev) =>
                                                  prev.filter(
                                                    (m) => m.id !== mix.id,
                                                  ),
                                                );
                                                toast.success(
                                                  lang === "ar"
                                                    ? "تم الحذف"
                                                    : "Deleted successfully",
                                                );
                                              } catch (err: unknown) {
                                                const msg =
                                                  err instanceof Error
                                                    ? err.message
                                                    : String(err);
                                                if (msg === "HAS_ORDERS") {
                                                  toast.error(
                                                    lang === "ar"
                                                      ? "لا يمكن حذف خلطة مرتبطة بطلبات!"
                                                      : "Cannot delete mix with active orders",
                                                  );
                                                } else {
                                                  toast.error(msg);
                                                }
                                              }
                                            },
                                          });
                                        }}
                                        title={
                                          dict.actions?.delete_perm ||
                                          "Delete Permanently"
                                        }
                                        className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 shrink-0"
                                      >
                                        <Icons.Trash className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        {/* HISTORY MODAL OVERLAY */}
        {historyModalId &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 text-right">
              {/* Click outside to close */}
              <div
                className="absolute inset-0"
                onClick={() => setHistoryModalId(null)}
              />

              <div
                dir="rtl"
                className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <Icons.History className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {dict.history?.title ||
                          (lang === "ar" ? "سجل الإصدارات" : "Version History")}
                      </h3>
                      <p className="text-[10px] text-slate-400 text-right">
                        {mixes.find((m) => m.id === historyModalId)?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHistoryModalId(null)}
                    className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ${lang === "ar" ? "mr-auto" : "ml-auto"}`}
                    title={lang === "ar" ? "إغلاق" : "Close"}
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body (Scrollable List) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {mixes
                    .find((m) => m.id === historyModalId)
                    ?.history?.map((hist) => (
                      <div
                        key={hist.id}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors group"
                      >
                        <div className="flex flex-col gap-1.5 text-right">
                          <div className="flex items-center gap-3">
                            <span
                              className="font-black text-lg text-white font-mono"
                              dir="ltr"
                            >
                              v{hist.version}
                            </span>
                            <MixStatusBadge status={hist.status} />
                          </div>
                          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 font-mono">
                            <span dir="ltr">
                              {format(new Date(hist.updatedAt), "yyyy-MM-dd")}
                            </span>
                            <Icons.Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="mt-2 text-xs text-slate-400 border-t border-slate-700/50 pt-2 border-dashed">
                            <span className="font-bold text-slate-300">
                              {dict.history?.note ||
                                (lang === "ar"
                                  ? "ملاحظة التعديل: "
                                  : "Change Note: ")}
                            </span>
                            {hist.changeNote ||
                              (lang === "ar"
                                ? "النسخة الأولى / إدخال أولي"
                                : "Initial version")}
                          </div>
                        </div>

                        <Link
                          href={`/system/lab/mix-designs/${hist.id}/view`}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-sm font-bold transition-all border border-indigo-500/20 whitespace-nowrap"
                        >
                          <Icons.Eye className="w-4 h-4" />
                          {dict.actions?.view ||
                            (lang === "ar" ? "عرض" : "View")}
                        </Link>
                      </div>
                    ))}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end rounded-b-2xl">
                  <button
                    onClick={() => setHistoryModalId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-slate-700"
                  >
                    {lang === "ar" ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </motion.div>
    </div>
  );
}
