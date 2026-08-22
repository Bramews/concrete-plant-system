"use client";
import { motion } from "framer-motion";

interface ScadaSiloSVGProps {
  id: string | number;
  name: string;
  stock: number;
  maxCapacity: number;
  unit: string;
  showLabel?: boolean;
}

export function ScadaSiloSVG({ id, name, stock, maxCapacity, unit, showLabel = true }: ScadaSiloSVGProps) {
  // Safe math
  const capacity = Math.max(1, maxCapacity);
  const percentage = Math.min(100, Math.max(0, (stock / capacity) * 100));
  
  // Calculate fill color based on threshold
  const fillColor = percentage > 40 ? "#10b981" : percentage > 20 ? "#f59e0b" : "#ef4444";
  
  // y starts from bottom (150). Total height is 140.
  const computed_height = 140 * (percentage / 100);
  const computed_y = 10 + 140 * (1 - percentage / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-64 flex items-center justify-center">
        <svg viewBox="0 0 80 200" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <clipPath id={`silo-clip-${id}`}>
              <rect x="10" y="10" width="60" height="140" rx="2" />
            </clipPath>
            
            <linearGradient id={`silo-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <filter id="glow-red">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 1. الرقبة العلوية */}
          <rect x="25" y="0" width="30" height="10" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
          
          {/* 4. الساق (خلف المخروط) */}
          <rect x="25" y="150" width="8" height="40" fill="#334155" />
          <rect x="47" y="150" width="8" height="40" fill="#334155" />

          {/* المادة المملوءة (داخل الجسم) */}
          <motion.rect
            x="10"
            width="60"
            clipPath={`url(#silo-clip-${id})`}
            fill={fillColor}
            initial={{ y: 150, height: 0 }}
            animate={{ y: computed_y, height: computed_height }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter={percentage < 20 ? "url(#glow-red)" : undefined}
          />

          {/* 2. الجسم الرئيسي (الإطار الخارجي) */}
          <rect x="10" y="10" width="60" height="140" fill="none" stroke="#1e3a5f" strokeWidth="1.5" rx="2" />
          
          {/* تأثير اللمعان (Shine) */}
          <rect x="10" y="10" width="15" height="140" fill={`url(#silo-shine-${id})`} rx="2" />

          {/* 3. المخروط السفلي */}
          <polygon points="10,150 40,180 70,150" fill="#1e293b" stroke="#1e3a5f" strokeWidth="1.5" />
          <polygon points="10,150 40,180 70,150" fill={`url(#silo-shine-${id})`} />

          {/* خطوط مستوى */}
          <line x1="10" x2="70" y1="45" y2="45" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="10" x2="70" y1="80" y2="80" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="10" x2="70" y1="115" y2="115" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* النسبة المئوية داخل الصومعة */}
          {percentage > 15 && (
            <text 
              x="40" 
              y={computed_y + (computed_height / 2) + 4} 
              fill="white" 
              fontSize="12" 
              fontWeight="900" 
              textAnchor="middle"
              className="drop-shadow-md font-mono"
            >
              {Math.round(percentage)}%
            </text>
          )}
        </svg>

        {/* النسبة المئوية إذا كانت الصومعة شبه فارغة (تظهر بالخارج) */}
        {percentage <= 15 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4 text-red-400 font-black font-mono text-sm drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
            {Math.round(percentage)}%
          </div>
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <h4 className="text-sm font-bold text-slate-300 text-center">{name}</h4>
          <span className="text-xs font-mono text-slate-400">
            {stock.toLocaleString()} {unit}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider
            ${percentage > 40 ? 'bg-emerald-500/20 text-emerald-400' : 
              percentage > 20 ? 'bg-amber-500/20 text-amber-400' : 
              'bg-red-500/20 text-red-400 animate-pulse'}
          `}>
            {percentage > 40 ? 'طبيعي' : percentage > 20 ? 'تحذير' : 'حرج'}
          </span>
          <span className="text-xs font-mono text-slate-500 mt-0.5">
            {stock > 0 ? `يكفي لـ ${Math.max(1, Math.round(stock / (maxCapacity * 0.05)))} يوم` : "فارغ — تعبئة فورية"}
          </span>
        </div>
      )}
    </div>
  );
}
