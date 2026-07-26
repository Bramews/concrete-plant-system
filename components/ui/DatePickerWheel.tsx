"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/Icons";

interface DatePickerWheelProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function DatePickerWheel({
  value,
  onChange,
  label,
}: DatePickerWheelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const getInitialState = () => {
    if (value && value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { d, m, y };
      }
    }
    const today = new Date();
    return {
      d: today.getDate(),
      m: today.getMonth() + 1,
      y: today.getFullYear(),
    };
  };

  const initialState = getInitialState();
  const [day, setDay] = useState(initialState.d);
  const [month, setMonth] = useState(initialState.m);
  const [year, setYear] = useState(initialState.y);

  const formatInputDisplay = (d: number, m: number, y: number) => {
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  };

  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      if (value && value.includes("-")) {
        const parts = value.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDay(d);
            setMonth(m);
            setYear(y);
            setTextValue(formatInputDisplay(d, m, y));
            return;
          }
        }
      }
      setTextValue(value || "");
    }
  }, [value, isOpen]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [popoverPos, setPopoverPos] = useState({
    top: 0,
    left: 0,
    openUp: false,
  });

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight;

      setPopoverPos({
        top: openUp
          ? rect.top + window.scrollY - popoverHeight - 4
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        openUp,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const commitDate = (newD: number, newM: number, newY: number) => {
    setDay(newD);
    setMonth(newM);
    setYear(newY);
    setTextValue(formatInputDisplay(newD, newM, newY));
    onChange(
      `${newY}-${String(newM).padStart(2, "0")}-${String(newD).padStart(2, "0")}`,
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i);

  const daysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    onChange(e.target.value);
  };

  const autoCompleteDate = (inputVal: string) => {
    if (!inputVal) return;
    const cleaned = inputVal.replace(/[\s.-]+/g, "/").trim();
    if (!cleaned) return;
    const parts = cleaned.split("/");
    const today = new Date();
    let d = today.getDate(),
      m = today.getMonth() + 1,
      y = today.getFullYear();
    if (parts.length >= 1 && parts[0]) {
      const p = parseInt(parts[0], 10);
      if (!isNaN(p) && p >= 1 && p <= 31) d = p;
    }
    if (parts.length >= 2 && parts[1]) {
      const p = parseInt(parts[1], 10);
      if (!isNaN(p) && p >= 1 && p <= 12) m = p;
    }
    if (parts.length >= 3 && parts[2]) {
      let p = parseInt(parts[2], 10);
      if (!isNaN(p)) {
        if (p < 100) p += 2000;
        if (p >= 2000 && p <= 2099) y = p;
      }
    }
    commitDate(d, m, y);
  };

  // Build calendar grid for current month
  const calendarDays = () => {
    const total = daysInMonth(month, year);
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    for (let d = 1; d <= total; d++) grid.push(d);
    return grid;
  };

  const prevMonth = () => {
    let newM = month - 1,
      newY = year;
    if (newM < 1) {
      newM = 12;
      newY--;
    }
    setMonth(newM);
    setYear(newY);
    const maxD = daysInMonth(newM, newY);
    if (day > maxD) setDay(maxD);
  };

  const nextMonth = () => {
    let newM = month + 1,
      newY = year;
    if (newM > 12) {
      newM = 1;
      newY++;
    }
    setMonth(newM);
    setYear(newY);
    const maxD = daysInMonth(newM, newY);
    if (day > maxD) setDay(maxD);
  };

  const weekDays = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const popoverContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: popoverPos.openUp ? 6 : -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: popoverPos.openUp ? 6 : -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed w-[280px] bg-[#0c1222] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 99999,
          }}
        >
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Icons.ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {MONTHS_AR[month - 1]}
              </span>
              <select
                value={year}
                onChange={(e) => {
                  setYear(parseInt(e.target.value));
                }}
                className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer appearance-none text-center"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 px-3 pt-2 pb-1">
            {weekDays.map((wd) => (
              <div
                key={wd}
                className="text-center text-[9px] font-bold text-slate-600 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
            {calendarDays().map((d, i) => (
              <div key={i} className="flex items-center justify-center">
                {d === null ? (
                  <div className="w-8 h-8" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      commitDate(d, month, year);
                      setIsOpen(false);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      d === day &&
                      month === getInitialState().m &&
                      year === getInitialState().y
                        ? "bg-primary text-white shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                        : d === new Date().getDate() &&
                            month === new Date().getMonth() + 1 &&
                            year === new Date().getFullYear()
                          ? "bg-white/5 text-primary ring-1 ring-primary/30 hover:bg-primary/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                commitDate(t.getDate(), t.getMonth() + 1, t.getFullYear());
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-primary hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative w-full" ref={triggerRef}>
      <div className="relative flex items-center border-b border-white/5 focus-within:border-primary transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
          title="افتح منتقي التاريخ"
        >
          <Icons.ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <input
          type="text"
          lang="en"
          dir="ltr"
          value={textValue}
          onChange={handleTextChange}
          onBlur={() => autoCompleteDate(textValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") autoCompleteDate(textValue);
          }}
          className="w-full bg-transparent py-0.5 outline-none text-white font-black text-base font-mono pl-7 pr-3 text-left"
          placeholder="DD/MM/YYYY"
          title={label}
        />
      </div>
      {portalTarget && createPortal(popoverContent, portalTarget)}
    </div>
  );
}
