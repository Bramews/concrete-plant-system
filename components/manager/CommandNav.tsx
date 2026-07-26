"use client";

import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BidiText } from "@/components/ui/BidiText";
import {
  searchEverything,
  getCustomerDetails,
  getProjectDetails,
  getMixDesignDetails,
  getCubeTestDetails,
  getSieveAnalysisDetails,
} from "@/app/actions/manager";

interface CommandNavProps {
  dict?: Record<string, string>;
}

const STATIC_COMMANDS = [
  {
    key: "orders",
    labelAr: "الطلبات والطلبيات",
    href: "/system/orders",
    icon: Icons.FileText,
    color: "from-cyan-500 to-blue-500",
    desc: "عرض ومتابعة كافة طلبيات الخرسانة وحالاتها",
  },
  {
    key: "create",
    labelAr: "إضافة طلب جديد",
    href: "/system/orders/create",
    icon: Icons.Plus,
    color: "from-violet-500 to-fuchsia-500",
    desc: "إنشاء طلبية خرسانة جديدة وتحديد المواصفات",
  },
  {
    key: "lab",
    labelAr: "إشعارات المختبر",
    href: "/system/manager/lab-notifications",
    icon: Icons.Activity,
    color: "from-emerald-500 to-teal-500",
    desc: "متابعة فحوصات المختبر والمواد المرفوضة",
  },
  {
    key: "materials",
    labelAr: "إدارة الموارد والمواد",
    href: "/system/manager/materials",
    icon: Icons.Box,
    color: "from-amber-500 to-orange-500",
    desc: "متابعة المخزون وتوريد المواد الأولية للمحطة",
  },
  {
    key: "machines",
    labelAr: "الآليات والمعدات",
    href: "/system/manager/machines",
    icon: Icons.Dashboard,
    color: "from-rose-500 to-pink-500",
    desc: "مراقبة خلاطات الخرسانة ومضخات الموقع والوقود",
  },
];

export function CommandNav({ dict }: CommandNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "materials" | "projects" | "customers" | "results"
  >("all");
  const [loading, setLoading] = useState(false);

  // Search Results
  const [results, setResults] = useState<{
    materials: any[];
    projects: any[];
    customers: any[];
    mixDesigns: any[];
    cubeTests: any[];
    sieveAnalyses: any[];
  }>({
    materials: [],
    projects: [],
    customers: [],
    mixDesigns: [],
    cubeTests: [],
    sieveAnalyses: [],
  });

  // Selected Detail Preview
  const [selectedItem, setSelectedItem] = useState<{
    type: string;
    id: number;
    name?: string;
  } | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Listen to Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce Search API
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setResults({
        materials: [],
        projects: [],
        customers: [],
        mixDesigns: [],
        cubeTests: [],
        sieveAnalyses: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      const searchRes = await searchEverything(query);
      setResults(searchRes);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  // Fetch details on selection
  useEffect(() => {
    if (!selectedItem) {
      setDetailData(null);
      return;
    }

    let isSubscribed = true;
    const loadDetails = async () => {
      setDetailLoading(true);
      try {
        let data = null;
        if (selectedItem.type === "customer") {
          data = await getCustomerDetails(selectedItem.id);
        } else if (selectedItem.type === "project") {
          data = await getProjectDetails(selectedItem.id);
        } else if (selectedItem.type === "mixDesign") {
          data = await getMixDesignDetails(selectedItem.id);
        } else if (selectedItem.type === "cubeTest") {
          data = await getCubeTestDetails(selectedItem.id);
        } else if (selectedItem.type === "sieveAnalysis") {
          data = await getSieveAnalysisDetails(selectedItem.id);
        }

        if (isSubscribed) {
          setDetailData(data);
        }
      } catch (err) {
        console.error("Error loading search item details:", err);
      } finally {
        if (isSubscribed) {
          setDetailLoading(false);
        }
      }
    };

    loadDetails();
    return () => {
      isSubscribed = false;
    };
  }, [selectedItem]);

  // Tab Filtering counts
  const totalResultsCount =
    results.materials.length +
    results.projects.length +
    results.customers.length +
    results.mixDesigns.length +
    results.cubeTests.length +
    results.sieveAnalyses.length;

  const navigateToMaterial = (materialName: string) => {
    setIsOpen(false);
    router.push(
      `/system/manager/materials?q=${encodeURIComponent(materialName)}`,
    );
  };

  const hasAnyResults = totalResultsCount > 0;

  return (
    <>
      {/* Visual Search Bar Trigger */}
      <div
        onClick={() => setIsOpen(true)}
        className="relative min-w-[260px] max-w-sm bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/30 rounded-2xl p-3 pr-10 pl-4 flex items-center justify-between cursor-pointer transition-all duration-300 shadow-lg shadow-black/20 group"
      >
        <div className="absolute right-3.5 flex items-center pointer-events-none">
          <Icons.Search className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
        </div>
        <span className="text-slate-400 text-sm font-bold placeholder-opacity-50 select-none">
          {dict?.search_placeholder || "بحث سريع... (Ctrl+K)"}
        </span>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
          <span className="text-[10px] text-slate-500 font-mono font-black">
            CTRL
          </span>
          <span className="text-[10px] text-slate-500 font-mono font-black">
            +
          </span>
          <span className="text-[10px] text-slate-500 font-mono font-black">
            K
          </span>
        </div>
      </div>

      {/* Spotlight Command Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#04060b]/90 backdrop-blur-md transition-opacity"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
              setSelectedItem(null);
            }}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-5xl bg-[#090d16] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header Search Input */}
            <div className="relative border-b border-white/[0.06] p-5 flex items-center">
              <Icons.Search className="w-5 h-5 text-violet-400 ml-3" />
              <input
                type="text"
                className="flex-1 bg-transparent border-0 text-white text-base py-1 pr-1 pl-12 focus:outline-none focus:ring-0 font-bold placeholder:text-slate-500"
                placeholder="ابحث عن مواد، عملاء، مشاريع، خلطات، نتائج فحوصات مكعبات..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedItem(null);
                }}
                autoFocus
              />
              <div className="flex items-center gap-2 mr-3">
                {loading && (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    setSelectedItem(null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body (Split Pane: Left = Details Preview, Right = Search Results) */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              {/* Right Side: Results List */}
              <div className="flex-1 overflow-y-auto border-l border-white/[0.06] flex flex-col">
                {/* Tabs */}
                {query && (
                  <div className="flex border-b border-white/[0.06] px-5 py-2 overflow-x-auto gap-2 scrollbar-none">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "all"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      الكل ({totalResultsCount})
                    </button>
                    <button
                      onClick={() => setActiveTab("materials")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "materials"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      المواد ({results.materials.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("projects")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "projects"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      المشاريع ({results.projects.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("customers")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "customers"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      العملاء ({results.customers.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("results")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "results"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      الفحوصات والخلطات (
                      {results.mixDesigns.length +
                        results.cubeTests.length +
                        results.sieveAnalyses.length}
                      )
                    </button>
                  </div>
                )}

                <div className="flex-1 p-5 space-y-6">
                  {/* Default / Static Navigation commands */}
                  {!query && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        روابط الوصول السريع
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {STATIC_COMMANDS.map((cmd) => {
                          const IconComp = cmd.icon;
                          return (
                            <button
                              key={cmd.key}
                              onClick={() => {
                                setIsOpen(false);
                                router.push(cmd.href);
                              }}
                              className="w-full text-right p-3 rounded-2xl hover:bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center gap-4 transition-all duration-300 group"
                            >
                              <div
                                className={`p-2.5 rounded-xl bg-gradient-to-br ${cmd.color} text-white shadow-md`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-black text-white group-hover:text-violet-400 transition-colors">
                                  {cmd.labelAr}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {cmd.desc}
                                </p>
                              </div>
                              <Icons.ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-white transition-all transform group-hover:-translate-x-1" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search Results Display */}
                  {query && !hasAnyResults && !loading && (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                        <Icons.Search className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-extrabold">
                        لا توجد نتائج مطابقة للبحث
                      </p>
                      <p className="text-slate-600 text-xs mt-1">
                        تأكد من كتابة الكلمة بشكل صحيح وجرب كتابة أحرف أخرى.
                      </p>
                    </div>
                  )}

                  {query && hasAnyResults && (
                    <div className="space-y-6">
                      {/* Materials List */}
                      {results.materials.length > 0 &&
                        (activeTab === "all" || activeTab === "materials") && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Icons.Box className="w-4 h-4 text-emerald-400" />
                              <span>
                                المواد المكتشفة ({results.materials.length})
                              </span>
                            </h4>
                            <div className="space-y-1">
                              {results.materials.map((m) => (
                                <div
                                  key={m.id}
                                  onClick={() => navigateToMaterial(m.name)}
                                  onMouseEnter={() =>
                                    setSelectedItem({
                                      type: "material",
                                      id: m.id,
                                      name: m.name,
                                    })
                                  }
                                  className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    selectedItem?.type === "material" &&
                                    selectedItem?.id === m.id
                                      ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        {m.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        رمز المادة:{" "}
                                        <BidiText>{m.code || "-"}</BidiText>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                      المخزون: <BidiText>{m.stock}</BidiText>{" "}
                                      {m.unit}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Projects List */}
                      {results.projects.length > 0 &&
                        (activeTab === "all" || activeTab === "projects") && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Icons.FileText className="w-4 h-4 text-blue-400" />
                              <span>
                                المشاريع النشطة ({results.projects.length})
                              </span>
                            </h4>
                            <div className="space-y-1">
                              {results.projects.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() =>
                                    setSelectedItem({
                                      type: "project",
                                      id: p.id,
                                    })
                                  }
                                  onMouseEnter={() =>
                                    setSelectedItem({
                                      type: "project",
                                      id: p.id,
                                    })
                                  }
                                  className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    selectedItem?.type === "project" &&
                                    selectedItem?.id === p.id
                                      ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        {p.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        الموقع:{" "}
                                        <BidiText>{p.location || "-"}</BidiText>
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
                                    مشروع
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Customers List */}
                      {results.customers.length > 0 &&
                        (activeTab === "all" || activeTab === "customers") && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Icons.Users className="w-4 h-4 text-violet-400" />
                              <span>
                                الزبائن والعملاء ({results.customers.length})
                              </span>
                            </h4>
                            <div className="space-y-1">
                              {results.customers.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() =>
                                    setSelectedItem({
                                      type: "customer",
                                      id: c.id,
                                    })
                                  }
                                  onMouseEnter={() =>
                                    setSelectedItem({
                                      type: "customer",
                                      id: c.id,
                                    })
                                  }
                                  className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    selectedItem?.type === "customer" &&
                                    selectedItem?.id === c.id
                                      ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        {c.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        رقم الهاتف:{" "}
                                        <BidiText>{c.phone || "-"}</BidiText>
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
                                    عميل
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Test Results / Mix Designs */}
                      {(results.mixDesigns.length > 0 ||
                        results.cubeTests.length > 0 ||
                        results.sieveAnalyses.length > 0) &&
                        (activeTab === "all" || activeTab === "results") && (
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Icons.Activity className="w-4 h-4 text-amber-400" />
                              <span>
                                الفحوصات والنتائج المخبرية (
                                {results.mixDesigns.length +
                                  results.cubeTests.length +
                                  results.sieveAnalyses.length}
                                )
                              </span>
                            </h4>

                            {/* Mix Designs */}
                            {results.mixDesigns.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mr-2">
                                  تصاميم الخلطات
                                </h5>
                                {results.mixDesigns.map((md) => (
                                  <div
                                    key={md.id}
                                    onClick={() =>
                                      setSelectedItem({
                                        type: "mixDesign",
                                        id: md.id,
                                      })
                                    }
                                    onMouseEnter={() =>
                                      setSelectedItem({
                                        type: "mixDesign",
                                        id: md.id,
                                      })
                                    }
                                    className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                      selectedItem?.type === "mixDesign" &&
                                      selectedItem?.id === md.id
                                        ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                    }`}
                                  >
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        {md.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        الرمز: <BidiText>{md.code}</BidiText> •
                                        الدرجة:{" "}
                                        <BidiText>{md.grade || "-"}</BidiText>
                                      </p>
                                    </div>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded font-black ${
                                        md.status === "APPROVED"
                                          ? "bg-emerald-500/10 text-emerald-400"
                                          : "bg-amber-500/10 text-amber-400"
                                      }`}
                                    >
                                      {md.status === "APPROVED"
                                        ? "معتمد"
                                        : "مسودة"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Cube Tests */}
                            {results.cubeTests.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mr-2">
                                  فحوصات المكعبات للخرسانة
                                </h5>
                                {results.cubeTests.map((ct) => (
                                  <div
                                    key={ct.id}
                                    onClick={() =>
                                      setSelectedItem({
                                        type: "cubeTest",
                                        id: ct.id,
                                      })
                                    }
                                    onMouseEnter={() =>
                                      setSelectedItem({
                                        type: "cubeTest",
                                        id: ct.id,
                                      })
                                    }
                                    className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                      selectedItem?.type === "cubeTest" &&
                                      selectedItem?.id === ct.id
                                        ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                    }`}
                                  >
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        فحص طلبيّة:{" "}
                                        <BidiText>
                                          {ct.order.orderNumber}
                                        </BidiText>
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        الزبون: {ct.order.customer?.name || "-"}{" "}
                                        • العمر: <BidiText>{ct.age}</BidiText>{" "}
                                        يوم
                                      </p>
                                    </div>
                                    <div className="text-left flex flex-col items-end gap-1">
                                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                                        مكعبات
                                      </span>
                                      {ct.mpa && (
                                        <span className="text-xs font-black text-amber-400">
                                          <BidiText>{ct.mpa}</BidiText> MPa
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Sieve Analyses */}
                            {results.sieveAnalyses.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mr-2">
                                  فحوصات التحليل المنخلي
                                </h5>
                                {results.sieveAnalyses.map((sa) => (
                                  <div
                                    key={sa.id}
                                    onClick={() =>
                                      setSelectedItem({
                                        type: "sieveAnalysis",
                                        id: sa.id,
                                      })
                                    }
                                    onMouseEnter={() =>
                                      setSelectedItem({
                                        type: "sieveAnalysis",
                                        id: sa.id,
                                      })
                                    }
                                    className={`w-full text-right p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                      selectedItem?.type === "sieveAnalysis" &&
                                      selectedItem?.id === sa.id
                                        ? "bg-white/[0.04] border-violet-500/30 shadow-lg shadow-black/10"
                                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                                    }`}
                                  >
                                    <div>
                                      <p className="text-sm font-black text-white">
                                        تحليل: {sa.material.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        المورد: {sa.supplier || "-"} • المنطقة:{" "}
                                        <BidiText>{sa.zone || "-"}</BidiText>
                                      </p>
                                    </div>
                                    <div className="text-left flex flex-col items-end gap-1">
                                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                                        منخلي
                                      </span>
                                      {sa.finenessModulus && (
                                        <span className="text-xs font-black text-blue-400">
                                          F.M:{" "}
                                          <BidiText>
                                            {sa.finenessModulus}
                                          </BidiText>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Left Side: Detail Preview Panel */}
              <div className="hidden md:flex w-[400px] bg-[#0c1220]/60 p-6 flex-col overflow-y-auto">
                {!selectedItem ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center mb-3">
                      <Icons.ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">
                      عرض تفاصيل العنصر
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
                      قم بتمرير الفأرة أو النقر فوق نتائج البحث لعرض تفاصيلها
                      الفورية هنا.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Header info */}
                    <div className="pb-4 border-b border-white/[0.06] mb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-wider mb-2">
                        <span>نوع العنصر:</span>
                        <span>
                          {selectedItem.type === "material" && "مخزون مادة"}
                          {selectedItem.type === "customer" && "حساب عميل"}
                          {selectedItem.type === "project" && "مشروع هندسي"}
                          {selectedItem.type === "mixDesign" && "تصميم خلطة"}
                          {selectedItem.type === "cubeTest" && "فحص كسر مكعبات"}
                          {selectedItem.type === "sieveAnalysis" &&
                            "تحليل منخلي"}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white leading-snug">
                        {selectedItem.name ||
                          (detailData &&
                            (detailData.name || `فحص #${detailData.id}`))}
                      </h3>
                    </div>

                    {detailLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs text-slate-500 font-bold">
                          جاري تحميل التفاصيل...
                        </span>
                      </div>
                    ) : detailData || selectedItem.type === "material" ? (
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Dynamic content depending on type */}
                        <div className="space-y-5 text-sm text-slate-300">
                          {/* 1. Material details (Static from list) */}
                          {selectedItem.type === "material" &&
                            (() => {
                              const mat = results.materials.find(
                                (m) => m.id === selectedItem.id,
                              );
                              if (!mat) return null;
                              return (
                                <div className="space-y-4">
                                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-bold">
                                        رمز المادة:
                                      </span>
                                      <span className="text-white font-mono font-bold">
                                        <BidiText>{mat.code || "-"}</BidiText>
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-bold">
                                        المخزون الحالي:
                                      </span>
                                      <span className="text-emerald-400 font-bold">
                                        <BidiText>{mat.stock}</BidiText>{" "}
                                        {mat.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-bold">
                                        تاريخ الإضافة:
                                      </span>
                                      <span className="text-slate-400">
                                        <BidiText>
                                          {new Date(
                                            mat.createdAt,
                                          ).toLocaleDateString("ar-IQ")}
                                        </BidiText>
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => navigateToMaterial(mat.name)}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                  >
                                    <Icons.Box className="w-4 h-4" />
                                    <span>اذهب لصفحة إدارة المواد</span>
                                  </button>
                                </div>
                              );
                            })()}

                          {/* 2. Customer Details */}
                          {selectedItem.type === "customer" && detailData && (
                            <div className="space-y-4">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    رقم الهاتف:
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>
                                      {detailData.phone || "-"}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    البريد الإلكتروني:
                                  </span>
                                  <span className="text-white">
                                    <BidiText>
                                      {detailData.email || "-"}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    العنوان:
                                  </span>
                                  <span className="text-slate-300 font-medium">
                                    {detailData.address || "-"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                                  الطلبات الأخيرة للزبون (
                                  {detailData.orders?.length || 0})
                                </h4>
                                {detailData.orders?.length > 0 ? (
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                    {detailData.orders.map((o: any) => (
                                      <div
                                        key={o.id}
                                        className="p-2 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1"
                                      >
                                        <div className="flex justify-between">
                                          <span className="text-white font-bold">
                                            <BidiText>{o.orderNumber}</BidiText>
                                          </span>
                                          <span className="text-violet-400 font-bold">
                                            <BidiText>{o.volume}</BidiText> م³
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                          <span>
                                            المشروع: {o.project?.name || "-"}
                                          </span>
                                          <span>
                                            الخلطة:{" "}
                                            <BidiText>
                                              {o.mixDesign?.code || "-"}
                                            </BidiText>
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-600 italic mr-1">
                                    لا توجد طلبيات مسجلة لهذا العميل.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3. Project Details */}
                          {selectedItem.type === "project" && detailData && (
                            <div className="space-y-4">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    موقع المشروع:
                                  </span>
                                  <span className="text-white font-bold">
                                    {detailData.location || "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الحالة التشغيلية:
                                  </span>
                                  <span
                                    className={`font-bold ${detailData.status === "ACTIVE" ? "text-emerald-400" : "text-slate-400"}`}
                                  >
                                    {detailData.status === "ACTIVE"
                                      ? "نشط"
                                      : "مغلق"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                                  الطلبات المرتبطة بالموقع (
                                  {detailData.orders?.length || 0})
                                </h4>
                                {detailData.orders?.length > 0 ? (
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                    {detailData.orders.map((o: any) => (
                                      <div
                                        key={o.id}
                                        className="p-2 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1"
                                      >
                                        <div className="flex justify-between">
                                          <span className="text-white font-bold">
                                            <BidiText>{o.orderNumber}</BidiText>
                                          </span>
                                          <span className="text-cyan-400 font-bold">
                                            <BidiText>{o.volume}</BidiText> م³
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                          <span>
                                            الزبون: {o.customer?.name || "-"}
                                          </span>
                                          <span>
                                            الخلطة:{" "}
                                            <BidiText>
                                              {o.mixDesign?.code || "-"}
                                            </BidiText>
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-600 italic mr-1">
                                    لا توجد طلبيات مسجلة لهذا المشروع.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 4. Mix Design Details */}
                          {selectedItem.type === "mixDesign" && detailData && (
                            <div className="space-y-4">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الرمز والكود:
                                  </span>
                                  <span className="text-white font-bold font-mono">
                                    <BidiText>{detailData.code}</BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    قوة الخرسانة (Grade):
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>
                                      {detailData.grade || "-"}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الهبوط المستهدف (Slump):
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>
                                      {detailData.targetSlump
                                        ? `${detailData.targetSlump} mm`
                                        : "-"}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الكثافة (Density):
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>
                                      {detailData.targetDensity
                                        ? `${detailData.targetDensity} kg/m³`
                                        : "-"}
                                    </BidiText>
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                                  مكونات الخلطة التصميمية (لكل 1 م³)
                                </h4>
                                {detailData.MixComponent?.length > 0 ? (
                                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                                    {detailData.MixComponent.map(
                                      (comp: any) => (
                                        <div
                                          key={comp.id}
                                          className="p-2 bg-white/[0.01] border border-white/5 rounded-xl text-xs flex justify-between items-center"
                                        >
                                          <span className="text-slate-300 font-medium">
                                            {comp.material?.name ||
                                              "مادة غير معروفة"}
                                          </span>
                                          <span className="text-white font-bold font-mono">
                                            <BidiText>{comp.amount}</BidiText>{" "}
                                            <span className="text-slate-500">
                                              {comp.material?.unit || "كغم"}
                                            </span>
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-600 italic mr-1">
                                    لا توجد نسب ومكونات مضافة للخلطة.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 5. Cube Test Details */}
                          {selectedItem.type === "cubeTest" && detailData && (
                            <div className="space-y-4">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الطلبية المرتبطة:
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>
                                      {detailData.order?.orderNumber}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    الزبون:
                                  </span>
                                  <span className="text-slate-300 font-medium">
                                    {detailData.order?.customer?.name || "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    تاريخ الصب (أخذ العينة):
                                  </span>
                                  <span className="text-white">
                                    <BidiText>
                                      {detailData.sampleDate
                                        ? new Date(
                                            detailData.sampleDate,
                                          ).toLocaleDateString("ar-IQ")
                                        : "-"}
                                    </BidiText>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">
                                    عمر الفحص:
                                  </span>
                                  <span className="text-white font-bold">
                                    <BidiText>{detailData.age}</BidiText> يوم
                                  </span>
                                </div>
                                {detailData.mpa && (
                                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                                    <span className="text-slate-400 font-bold">
                                      قوة الكسر (MPa):
                                    </span>
                                    <span className="text-amber-400 font-mono font-black text-lg">
                                      <BidiText>{detailData.mpa}</BidiText> MPa
                                    </span>
                                  </div>
                                )}
                                {detailData.kn && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      حمل الكسر (kN):
                                    </span>
                                    <span className="text-white font-mono">
                                      <BidiText>{detailData.kn}</BidiText> kN
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-white/5 pt-2">
                                  <span className="text-slate-500 font-bold">
                                    حالة النتيجة:
                                  </span>
                                  <span
                                    className={`font-black text-xs px-2.5 py-0.5 rounded-lg border ${
                                      detailData.result === "PASS"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : detailData.result === "FAIL"
                                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}
                                  >
                                    {detailData.result === "PASS" && "ناجح"}
                                    {detailData.result === "FAIL" && "راسب"}
                                    {!detailData.result && "قيد الانتظار"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 6. Sieve Analysis Details */}
                          {selectedItem.type === "sieveAnalysis" &&
                            detailData && (
                              <div className="space-y-4">
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">
                                      المادة المفحوصة:
                                    </span>
                                    <span className="text-white font-bold">
                                      {detailData.material?.name}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">
                                      اسم المورد:
                                    </span>
                                    <span className="text-white font-medium">
                                      {detailData.supplier || "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">
                                      اسم المشروع:
                                    </span>
                                    <span className="text-slate-300">
                                      {detailData.projectName || "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">
                                      معامل النعومة (F.M):
                                    </span>
                                    <span className="text-blue-400 font-black text-base font-mono">
                                      <BidiText>
                                        {detailData.finenessModulus || "-"}
                                      </BidiText>
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">
                                      المنطقة الجغرافية:
                                    </span>
                                    <span className="text-white font-medium">
                                      <BidiText>
                                        {detailData.zone || "-"}
                                      </BidiText>
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-white/5 pt-2">
                                    <span className="text-slate-500 font-bold">
                                      حالة التحليل:
                                    </span>
                                    <span
                                      className={`font-black text-xs px-2.5 py-0.5 rounded-lg border ${
                                        detailData.status === "APPROVED"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      }`}
                                    >
                                      {detailData.status === "APPROVED"
                                        ? "معتمد ومقبول"
                                        : "تحت المراجعة"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Footer details info */}
                        <div className="mt-4 text-[10px] text-slate-500 text-center font-bold">
                          المعرف البرمجي الفريد في قاعدة البيانات:{" "}
                          <BidiText>#{selectedItem.id}</BidiText>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center text-slate-600">
                        فشل تحميل تفاصيل هذا العنصر
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
