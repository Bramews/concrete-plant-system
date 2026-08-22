"use client";
import React, { useState } from "react";
import Image from "next/image";

interface PlantMimicPanelProps {
  materials: Record<string, number>;
}

export function PlantMimicPanel({ materials }: PlantMimicPanelProps) {
  const [isRunning, setIsRunning] = useState(false);

  // Map real values or defaults
  const getVal = (key: string, def: number) => materials[key] ?? def;
  
  const agg1 = getVal("حصى", 698.6);
  const agg2 = getVal("رمل", 781.7);
  const agg3 = getVal("رمل ناعم", 949.4);
  const agg4 = getVal("حصى ناعم", 866.3);

  const cem1 = getVal("اسمنت عادي", 597.9);
  const wat1 = getVal("ماء", 223.1);
  const add1 = getVal("مضافات", 2611.0);

  const toggleRun = () => setIsRunning(!isRunning);

  return (
    <div className="mimic-panel flex flex-col" dir="ltr">
      {/* Windows Classic Tabs */}
      <div className="flex border-b border-black bg-[#d4d4d4] w-full text-sm font-bold h-[30px] shrink-0" dir="rtl">
        {["التقرير", "قيد", "الخلطات", "معايرة", "النظام", "المشغل", "التشغيل", "الرئيسية"].map((tab, i) => (
          <div key={i} className={`px-6 py-1 border-l border-black flex items-center justify-center cursor-default ${i === 7 ? 'bg-white border-b-white z-10 -mb-[1px]' : 'bg-[#dfdfdf] border-b-black shadow-[inset_1px_1px_0px_white]'}`}>
            {tab}
          </div>
        ))}
      </div>

      {/* Main Drawing Area */}
      <div className="flex-1 relative w-full h-full min-w-[1200px] overflow-hidden" dir="ltr">
        
        {/* --- 1. Aggregates (Top Left) --- */}
        <div className="absolute top-4 left-4 flex gap-2">
          {[
            { n: "حصو", v: agg1 },
            { n: "رمل", v: agg2 },
            { n: "رمل", v: agg3 },
            { n: "حصو", v: agg4 }
          ].map((b, i) => (
            <div key={i} className="w-[100px] flex flex-col items-center">
              <div className="hmi-bin-header w-full border border-black shadow-[inset_1px_1px_0px_white]">
                <div className="flex justify-between px-1">
                  <span className="text-[10px]">0.00</span>
                  <div className="hmi-indicator-green"></div>
                </div>
              </div>
              <div className="hmi-bin-body w-full border border-black flex flex-col items-center shadow-[inset_1px_1px_0px_white] pb-1">
                <span className="font-bold text-sm mb-1 text-white">{b.n}</span>
                <div className="w-[85px] hmi-value flex flex-col text-[14px]">
                  <div className="text-white">{b.v.toFixed(1)}</div>
                  <div className="text-white">{(i * 1.5).toFixed(1)}</div>
                  <div className="red-text">0.00</div>
                </div>
                {/* Control Buttons */}
                <div className="mt-1 flex gap-1">
                  <button className="hmi-btn px-1 py-0 text-[10px]">&lt; &gt;</button>
                </div>
              </div>
              {/* SVG Trapezoid */}
              <svg width="100" height="40" className="mt-[1px]">
                <polygon points="0,0 100,0 70,30 30,30" className="svg-grey" />
              </svg>
            </div>
          ))}
        </div>

        {/* Aggregate Conveyor */}
        <div className="absolute top-[280px] left-10 flex items-center">
          <div className="w-[30px] h-[30px] rounded-full bg-white border-2 border-black flex items-center justify-center relative z-10"></div>
          <div className={`w-[260px] hmi-conveyor-track -mx-2 ${isRunning ? 'active' : ''}`}></div>
          <div className="w-[30px] h-[30px] rounded-full bg-white border-2 border-black flex items-center justify-center relative z-10 text-green-500 font-bold text-[18px]">
             {isRunning ? '▶' : ''}
          </div>
          
          <div className="absolute -top-10 left-[140px] flex gap-1 bg-white border border-black p-1 text-[11px] font-bold rounded-[8px]" dir="rtl">
             <div className="w-3 h-3 rounded-full bg-red-600 border border-black"></div>
             توقف - السير
          </div>
        </div>

        <div className="absolute top-[320px] left-[150px] flex items-center">
          <div className="w-[30px] h-[30px] rounded-full bg-white border-2 border-black flex items-center justify-center relative z-10 text-green-500 font-bold text-[18px]">▶</div>
          <div className={`w-[160px] hmi-conveyor-track -mx-2 ${isRunning ? 'active' : ''}`}></div>
          <div className="w-[30px] h-[30px] rounded-full bg-white border-2 border-black flex items-center justify-center relative z-10 text-green-500 font-bold text-[18px]">▶</div>
        </div>

        {/* Aggregate Hopper */}
        <div className="absolute top-[230px] left-[420px] w-[140px]">
           <div className="border-[3px] border-yellow-500 bg-[#808080] p-1 text-center shadow-[inset_1px_1px_0px_white]">
              <div className="hmi-value text-[16px] text-white">1500.2 كج</div>
              <div className="mt-1">
                 <button className="hmi-btn px-2 py-0 text-[10px]">&lt; &gt;</button>
              </div>
           </div>
           <svg width="140" height="60">
              <polygon points="0,0 140,0 90,50 30,50" className="svg-grey" style={{stroke: '#eab308', strokeWidth: 3}} />
              <polygon points="30,50 90,50 60,60" fill="#808080" />
           </svg>
           <div className="absolute top-[90px] left-[55px] hmi-btn red text-[10px] rounded-full px-2">توقف</div>
        </div>


        {/* --- 2. Cement (Top Center) --- */}
        <div className="absolute top-4 left-[500px] flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[80px] flex flex-col items-center">
              <div className="hmi-bin-header w-full border border-black flex items-center justify-between px-1 shadow-[inset_1px_1px_0px_white]">
                 <input type="checkbox" defaultChecked className="w-3 h-3" />
                 <span className="text-[12px]">الاسمنت</span>
              </div>
              <div className="hmi-bin-body w-full border border-black flex flex-col items-center shadow-[inset_1px_1px_0px_white] pb-1">
                <div className="flex justify-between w-full px-2 mb-1">
                   <div className="hmi-indicator-red"></div>
                   <div className="hmi-indicator-red"></div>
                </div>
                <div className="w-[70px] hmi-value flex flex-col text-[14px]">
                  <div className="text-white">0</div>
                  <div className="text-white">{i===1 ? cem1.toFixed(1) : "0.0"}</div>
                  <div className="text-white">0.0</div>
                </div>
                <div className="mt-1 w-6 border border-black bg-white text-center text-[10px] font-bold">{i}</div>
              </div>
              <svg width="80" height="40" className="mt-[1px]">
                <polygon points="0,0 80,0 50,30 30,30" className="svg-grey" />
                <polygon points="40,30 50,40 30,40" fill="#22c55e" />
              </svg>
            </div>
          ))}
          <div className="hmi-btn dark text-[10px] absolute -bottom-4 left-[-30px]">توقف</div>
        </div>

        {/* Cement Hopper */}
        <div className="absolute top-[230px] left-[580px] w-[110px]">
           <div className="border-[3px] border-green-500 bg-[#808080] p-1 text-center shadow-[inset_1px_1px_0px_white]">
              <div className="hmi-value text-[14px] text-white">609.8 كج</div>
              <div className="text-[10px] text-green-500 font-bold mt-1 tracking-widest">1 2 3 4</div>
              <div className="mt-1">
                 <button className="hmi-btn px-2 py-0 text-[10px]">&lt; &gt;</button>
              </div>
           </div>
           <svg width="110" height="50">
              <polygon points="0,0 110,0 70,40 30,40" className="svg-grey" style={{stroke: '#22c55e', strokeWidth: 3}} />
              <circle cx="50" cy="40" r="8" fill="red" stroke="black" />
           </svg>
        </div>


        {/* --- 3. Water (Top Right) --- */}
        <div className="absolute top-4 left-[800px] flex flex-col items-center">
           <div className="w-[70px] hmi-bin-body border border-black bg-[#404040] shadow-[inset_1px_1px_0px_white]">
              <div className="text-white font-bold text-[12px] text-center border-b border-white pb-1 mb-1" dir="rtl">الماء</div>
              <div className="hmi-value bg-transparent border-none text-[14px]">
                 <div className="text-white">{wat1.toFixed(1)}</div>
                 <div className="text-white">0.0</div>
                 <div className="bg-[#3b82f6] text-white text-center mt-1 border border-black">14.0</div>
              </div>
           </div>
           <svg width="70" height="40" className="mt-[1px]">
             <polygon points="0,0 70,0 45,30 25,30" fill="#3b82f6" stroke="black" />
           </svg>
           <div className="hmi-btn dark text-[10px] absolute -bottom-6 left-[-20px]">توقف</div>
        </div>

        {/* Water Hopper */}
        <div className="absolute top-[230px] left-[780px] w-[90px]">
           <div className="border-[3px] border-[#3b82f6] bg-[#808080] p-1 text-center shadow-[inset_1px_1px_0px_white]">
              <div className="hmi-value text-[14px] text-white">231.2 كج</div>
              <div className="text-[10px] text-green-500 font-bold mt-1">1</div>
           </div>
           <svg width="90" height="40">
              <polygon points="0,0 90,0 60,35 30,35" className="svg-grey" style={{stroke: '#3b82f6', strokeWidth: 3}} />
              <circle cx="45" cy="35" r="8" fill="red" stroke="black" />
           </svg>
        </div>


        {/* --- 4. Additives (Far Right) --- */}
        <div className="absolute top-4 left-[920px] flex gap-2">
           {[1, 2].map(i => (
              <div key={i} className="w-[60px] flex flex-col items-center">
                 <div className="hmi-bin-header w-full border border-black flex items-center justify-between px-1 bg-[#804040]">
                    <span className="text-[10px] text-white">مضاف {i}</span>
                    <input type="checkbox" defaultChecked className="w-2 h-2" />
                 </div>
                 <div className="hmi-bin-body w-full border border-black bg-[#804040] shadow-[inset_1px_1px_0px_white]">
                    <div className="hmi-value bg-transparent border-none text-[12px]">
                       <div className="text-white">{i===1 ? add1.toFixed(1) : "0.0"}</div>
                       <div className="text-white">0.0</div>
                    </div>
                    <div className="mt-1 w-5 border border-black bg-white text-center text-[10px] font-bold mx-auto">{i}</div>
                 </div>
                 <svg width="60" height="30" className="mt-[1px]">
                   <polygon points="0,0 60,0 40,25 20,25" fill="#804040" stroke="black" />
                 </svg>
              </div>
           ))}
           <div className="hmi-btn dark text-[10px] absolute -bottom-6 left-[-10px]">توقف</div>
        </div>

        {/* Additive Hopper */}
        <div className="absolute top-[230px] left-[930px] w-[80px]">
           <div className="border-[3px] border-[#ef4444] bg-[#808080] p-1 text-center shadow-[inset_1px_1px_0px_white]">
              <div className="hmi-value text-[14px] text-white">-55.2 كج</div>
              <div className="text-[10px] text-green-500 font-bold mt-1">1 2 3 4</div>
           </div>
           <svg width="80" height="40">
              <polygon points="0,0 80,0 50,30 30,30" className="svg-grey" style={{stroke: '#ef4444', strokeWidth: 3}} />
              <circle cx="40" cy="30" r="8" fill="red" stroke="black" />
           </svg>
        </div>


        {/* --- Connecting Pipes (SVG Lines) --- */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
           {/* Agg to Mixer */}
           <polyline points="480,310 480,480 630,480 630,500" stroke="#a3a3a3" strokeWidth="3" fill="none" />
           {/* Cem to Mixer */}
           <polyline points="630,300 630,500" stroke="#a3a3a3" strokeWidth="3" fill="none" />
           {/* Wat to Mixer */}
           <polyline points="820,290 820,400 680,400 680,500" stroke="#a3a3a3" strokeWidth="3" fill="none" />
           {/* Add to Mixer */}
           <polyline points="970,290 970,420 730,420 730,500" stroke="#a3a3a3" strokeWidth="3" fill="none" />
        </svg>


        {/* --- 5. The Mixer (Bottom Center) --- */}
        <div className="absolute top-[480px] left-[550px] w-[260px] h-[100px] border-[3px] border-black rounded-[12px] bg-[#a3a3a3] shadow-[inset_2px_2px_0px_white] flex items-center justify-between p-2 z-10">
           <div className="flex flex-col gap-2">
              <button className="hmi-btn green rounded-[8px] text-[12px]">تشغيل</button>
              <button className="hmi-btn red rounded-[8px] text-[12px]">توقف</button>
           </div>
           
           <div className="w-[80px] h-[80px] rounded-full border-[3px] border-[#52525b] bg-[#e4e4e7] flex items-center justify-center relative overflow-hidden">
              <div className={`w-full h-full flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`} style={{animationDuration: '2s'}}>
                 <div className="w-[70px] h-[70px] rounded-full border-4 border-dashed border-[#52525b]"></div>
                 <div className="absolute w-[60px] h-2 bg-[#52525b] rotate-45"></div>
                 <div className="absolute w-[60px] h-2 bg-[#52525b] -rotate-45"></div>
              </div>
           </div>

           <div className="flex flex-col gap-1 items-center">
              <div className="bg-black text-[#4ade80] font-bold text-[10px] px-2 py-1 border border-white">الخلاط سليم</div>
              <div className="hmi-value w-[40px] text-center">0</div>
              <div className="flex gap-2">
                 <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-black"></div>
                 <button className="hmi-btn red text-[10px] px-1 py-0">توقف</button>
              </div>
           </div>

           <div className="w-[30px] h-[60px] bg-green-500 border-2 border-black flex items-center justify-center text-[18px]">
             🔊
           </div>
        </div>


        {/* --- 6. Realistic Truck --- */}
        <div className="absolute top-[580px] left-[610px] w-[140px] h-[90px] z-10">
           {/* Using the generated artifact image, copied to public */}
           <Image src="/mixer_truck.png" alt="Mixer Truck" fill className="object-contain" />
        </div>

        {/* --- Side Settings Panel --- */}
        <div className="absolute top-[500px] left-[840px] border border-black bg-white text-[12px] p-1 font-bold shadow-[2px_2px_0px_#808080]">
           <div className="flex justify-between border-b border-black"><span>1.67</span><span className="bg-[#dfdfdf] px-1 border-l border-black">ط/م</span></div>
           <div className="flex justify-between border-b border-black"><span>1</span><span className="bg-[#dfdfdf] px-1 border-l border-black">م</span></div>
           <button className="w-full bg-[#facc15] border border-black my-[1px] hover:bg-yellow-300">خلط طلب</button>
           <button className="w-full bg-[#facc15] border border-black my-[1px] hover:bg-yellow-300">خلط جديد</button>
           <div className="flex justify-between border-b border-black"><span>c40</span></div>
           <div className="flex justify-between border-b border-black"><span>10</span></div>
           <div className="flex justify-between border-b border-black"><span>8</span></div>
        </div>

      </div>

      {/* Bottom Control Bar */}
      <div className="w-full h-[60px] bg-black flex items-center shrink-0 border-t-2 border-white px-2 gap-4" dir="rtl">
         <div className="w-[50px] h-[40px] bg-[#dfdfdf] flex items-center justify-center border-2 border-white shadow-[inset_1px_1px_0px_#a3a3a3]">
            <span className="text-[24px]">🔊</span>
         </div>
         <div className="flex flex-col border border-white">
            <button className="bg-black text-white px-4 py-0 text-[12px] hover:bg-slate-800">تصفير الرفعة</button>
         </div>
         <button onClick={toggleRun} className="bg-black text-white border-2 border-white px-6 py-2 text-[14px] font-bold hover:bg-slate-800">
            ابدأ آلياً
         </button>
         <div className="flex flex-col border border-white h-full justify-center gap-1">
            <button className="bg-[#4ade80] text-black px-4 py-0 text-[12px] font-bold">الآلي</button>
            <button className="bg-[#333333] text-[#888888] px-4 py-0 text-[12px] font-bold">اليدوي</button>
         </div>
         <div className="flex flex-col border border-white h-full justify-center gap-1">
            <button className={`px-4 py-0 text-[12px] font-bold ${isRunning ? 'bg-[#4ade80] text-black' : 'bg-[#333333] text-[#888888]'}`}>يعمل</button>
            <button className={`px-4 py-0 text-[12px] font-bold ${!isRunning ? 'bg-black text-white' : 'bg-[#333333] text-[#888888]'}`}>توقف</button>
         </div>
         <div className="flex-1 text-left text-white font-mono text-[14px] tracking-widest px-4" dir="ltr">
            07/09/45 10:33:51 م
         </div>
      </div>
    </div>
  );
}
