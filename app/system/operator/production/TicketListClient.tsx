"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Ticket {
  id: number;
  ticketNumber: string;
  truckNumber: string;
  driverName: string;
  status: string;
  cumulativeQuantity: number;
  createdAt: Date;
  order: {
    orderNumber: string;
    volume: number;
    customer: { name: string };
    project: { name: string };
    mixDesign: { code: string };
  };
}

interface TicketListClientProps {
  tickets: Ticket[];
  dict: any;
}

export function TicketListClient({ tickets, dict }: TicketListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.order.customer.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        t.order.project.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [tickets, searchTerm]);

  return (
    <div
      className="z-root min-h-screen bg-slate-950 text-slate-300 p-8 lg:p-12 overflow-y-auto custom-scrollbar"
      dir="rtl"
    >
      <style dangerouslySetInnerHTML={{ __html: zStyles }} />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />

          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter western-nums">
              سجل تذاكر التسليم
            </h1>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mt-3 italic">
              أرشيف التذاكر الصادرة
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-max">
            <div className="relative flex-1 lg:w-80 group">
              <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="بحث برقم التذكرة أو العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-semibold text-white outline-none focus:bg-white/10 transition-all focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={() => window.print()}
              title="طباعة السجل"
              className="p-4 bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all active:scale-95 group"
            >
              <Icons.Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.length > 0 ? (
            filtered.map((ticket, i) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all relative overflow-hidden"
              >
                {/* ID & Time */}
                <div className="flex flex-col items-center lg:items-end w-32 border-l border-white/5 pl-8">
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10 western-nums mb-2">
                    {ticket.ticketNumber}
                  </span>
                  <div className="text-xs font-medium text-slate-400 western-nums tabular-nums">
                    {format(new Date(ticket.createdAt), "HH:mm:ss")}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex items-center gap-6 flex-1 px-8 py-4 lg:py-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                    <Icons.FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors uppercase">
                      {ticket.order.project?.name || "مشروع عام"}
                    </h4>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">
                      العميل: {ticket.order.customer?.name}
                    </p>
                  </div>
                </div>

                {/* Stats & Volume */}
                <div className="flex items-center gap-12 border-r border-white/5 pr-8">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1 tracking-wider">
                      الشاحنة
                    </p>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-white/5">
                      <Icons.Truck className="w-3 h-3 text-indigo-400" />
                      <span className="text-sm font-semibold text-white western-nums uppercase font-mono">
                        {ticket.truckNumber}
                      </span>
                    </div>
                  </div>

                  <div className="text-center min-w-[100px]">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1 tracking-wider">
                      الكمية التراكمية
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-indigo-400 western-nums">
                        {ticket.cumulativeQuantity}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        م³
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
                        ticket.status === "DISPATCHED"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                          : "bg-slate-500/10 text-slate-500 border-white/5",
                      )}
                    >
                      {ticket.status === "DISPATCHED"
                        ? "تم الصب والإرسال"
                        : ticket.status}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => window.print()}
                        title="طباعة التذكرة"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                      >
                        <Icons.Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-48 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[5rem]">
              <Icons.Inbox className="w-20 h-20 text-slate-600 mx-auto mb-6 opacity-40" />
              <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">
                لا توجد تذاكر صادرة حالياً
              </h3>
              <p className="text-slate-400 text-sm font-semibold mt-2 italic">
                بانتظار إشارة الصب والتسليم...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const zStyles = `
  .z-root,.z-root *{box-sizing:border-box}
  .western-nums{font-family:"Inter",sans-serif!important;font-variant-numeric:tabular-nums lining-nums!important}
  .custom-scrollbar::-webkit-scrollbar{width:6px}
  .custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
  .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
  footer{display:none!important}
`;
