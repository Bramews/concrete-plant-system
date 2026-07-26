
import os

base_file = r"C:\Users\brame\.gemini\antigravity\brain\5a3c7eaa-063c-4a92-8b53-c78498c4561b\sieve_utf8.txt"
target_file = r"d:\concrete-plant-system\app\system\lab\sieve-analysis\SieveAnalysisClient.tsx"

with open(base_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Props
old_props = 'export default function SieveAnalysisClient({ branding }: { branding?: any }) {'
new_props = '''export default function SieveAnalysisClient({ 
  branding, 
  initialMaterials = [], 
  initialStandards = [] 
}: { 
  branding?: any;
  initialMaterials?: any[];
  initialStandards?: any[];
}) {'''
content = content.replace(old_props, new_props)

# 2. Update Loading State
old_loading = 'const [loading, setLoading] = useState(true);'
new_loading = 'const [loading, setLoading] = useState(false);\n  const [saving, setSaving] = useState(false);\n  const [selectedMaterialId, setSelectedMaterialId] = useState<number | string>(initialMaterials[0]?.id || "");'
content = content.replace(old_loading, new_loading)

# 3. Update Material name state
old_material = 'const [material, setMaterial] = useState("رمل مغسول (ASTM)");'
new_material = 'const [materialName, setMaterialName] = useState(initialMaterials[0]?.name || "رمل مغسول (ASTM)");'
content = content.replace(old_material, new_material)

# 4. Update useEffect and add handleArchive
old_effect = '''  useEffect(() => {
    (async () => {
      try { await Promise.all([getSieveStandards(), getLabMaterials()]); } catch (e) {}
      finally { setLoading(false); }
    })();
  }, []);'''

new_effect = '''  // Sync material name when selection changes
  useEffect(() => {
    const mat = initialMaterials.find(m => m.id === Number(selectedMaterialId));
    if (mat) setMaterialName(mat.name);
  }, [selectedMaterialId, initialMaterials]);

  const handleArchive = async () => {
    if (!selectedMaterialId) return alert("يرجى اختيار المادة أولاً");
    setSaving(true);
    try {
      const { addSieveAnalysis } = await import("@/app/actions/lab");
      const readingMap: Record<string, number> = {};
      readings.forEach(r => { readingMap[r.size.toString()] = Number(r.weight || 0); });
      
      await addSieveAnalysis({
        materialId: Number(selectedMaterialId),
        totalWeight,
        readings: readingMap,
        moistureContent: Number(calculatedData.moistureContent),
        clayContent: Number(calculatedData.clayContent),
        testType: "Sieve Analysis"
      });
      alert("تمت الأرشفة بنجاح");
    } catch (error) {
       console.error(error);
       alert("فشل في حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };'''

content = content.replace(old_effect, new_effect)

# 5. Update UI Fields (Material Select)
old_fields = '''                    { label: "المشروع", value: project, setter: setProject, icon: Icons.Project, width: "w-1/4" },
                    { label: "المصدر", value: source, setter: setSource, icon: Icons.Globe, width: "w-1/4" },
                    { label: "المادة", value: material, setter: setMaterial, icon: Icons.Layers, width: "w-1/4" },
                    { label: "التاريخ", value: testDate, setter: setTestDate, icon: Icons.Clock, width: "w-1/6", type: "date" },
                  ].map((field, i) => (
                    <div key={i} className={`flex flex-col justify-center h-full ${field.width} relative group`}>
                       <div className="flex items-center gap-2 mb-0">
                          <field.icon className="w-3 h-3 text-sky-500/60" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{field.label}</span>
                       </div>
                       <input 
                         type={field.type || "text"}
                         value={field.value}
                         onChange={(e) => field.setter(e.target.value)}
                         className="bg-transparent border-none text-xs font-black text-white outline-none w-full text-right focus:text-sky-400 transition-colors h-5"
                       />
                    </div>
                  ))}'''

new_fields = '''                    { label: "المشروع", value: project, setter: setProject, icon: Icons.Project, width: "w-1/4" },
                    { label: "المصدر", value: source, setter: setSource, icon: Icons.Globe, width: "w-1/4" },
                    { 
                      label: "المادة", 
                      value: selectedMaterialId, 
                      setter: setSelectedMaterialId, 
                      icon: Icons.Layers, 
                      width: "w-1/4",
                      type: "select",
                      options: initialMaterials.map(m => ({ label: m.name, value: Number(m.id) }))
                    },
                    { label: "التاريخ", value: testDate, setter: setTestDate, icon: Icons.Clock, width: "w-1/6", type: "date" },
                  ].map((field, i) => (
                    <div key={i} className={`flex flex-col justify-center h-full ${field.width} relative group`}>
                       <div className="flex items-center gap-2 mb-0">
                          <field.icon className="w-3 h-3 text-sky-500/60" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{field.label}</span>
                       </div>
                       {field.type === "select" ? (
                         <select
                           value={field.value}
                           onChange={(e) => field.setter(e.target.value)}
                           className="bg-transparent border-none text-xs font-black text-white outline-none w-full text-right focus:text-sky-400 transition-colors h-5 appearance-none cursor-pointer"
                         >
                           {field.options?.map((opt: any) => (
                             <option key={opt.value} value={opt.value} className="bg-[#0d121d] text-white">
                               {opt.label}
                             </option>
                           ))}
                         </select>
                       ) : (
                         <input 
                           type={field.type || "text"}
                           value={field.value}
                           onChange={(e) => field.setter(e.target.value)}
                           className="bg-transparent border-none text-xs font-black text-white outline-none w-full text-right focus:text-sky-400 transition-colors h-5"
                         />
                       )}
                    </div>
                  ))}'''

content = content.replace(old_fields, new_fields)

# 6. Update FM UI
old_fm = '{ label: "معامل النعومة", value: "2.67", color: "text-indigo-400" },'
new_fm = '{ label: "معامل النعومة", value: calculatedData.finenessModulus, color: "text-indigo-400" },'
content = content.replace(old_fm, new_fm)

# 7. Update Archive Button
old_buttons = '''                 { icon: Icons.FileText, color: "bg-sky-500/10 text-sky-400 border-sky-500/20", label: "تقرير", onClick: () => setIsPrintModalOpen(true) },
                 { icon: Icons.Download, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "إكسل", onClick: () => alert("Excel Ready") },
                 { icon: Icons.Package, color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "أرشفة", onClick: () => alert("Archived") },
                 { icon: Icons.Printer, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", label: "طباعة", onClick: () => setIsPrintModalOpen(true) },'''

new_buttons = '''                 { icon: Icons.FileText, color: "bg-sky-500/10 text-sky-400 border-sky-500/20", label: "تقرير", onClick: () => setIsPrintModalOpen(true) },
                 { icon: Icons.Download, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "إكسل", onClick: () => alert("Excel Ready") },
                 { 
                     icon: Icons.Package, 
                     color: saving ? "bg-slate-500/10 text-zinc-500" : "bg-amber-500/10 text-amber-400 border-amber-500/20", 
                     label: saving ? "جاري..." : "أرشفة", 
                     onClick: handleArchive 
                 },
                 { icon: Icons.Printer, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", label: "طباعة", onClick: () => setIsPrintModalOpen(true) },'''

content = content.replace(old_buttons, new_buttons)

# 8. Update Print Modal data
old_modal_data = '''            projectName: project,
            source: source,
            material: { name: material },'''

new_modal_data = '''            projectName: project,
            source: source,
            material: { name: materialName },'''

content = content.replace(old_modal_data, new_modal_data)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Success")
