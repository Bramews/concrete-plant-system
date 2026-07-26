"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { deleteSharedFile } from "@/app/actions/network";

interface FileShareClientProps {
  companyId: number;
  scope: string;
  initialFiles: any[];
  userName: string;
  backUrl?: string;
  sectionLabel?: string;
  users?: { id: number; name: string }[];
  isManager?: boolean;
}

export function FileShareClient({
  companyId,
  scope,
  initialFiles,
  userName,
  backUrl = "",
  sectionLabel,
  users = [],
  isManager = false,
}: FileShareClientProps) {
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [senderName, setSenderName] = useState(userName);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [visibility, setVisibility] = useState(
    isManager ? "EVERYONE" : "DEPARTMENT",
  );
  const [targetUserId, setTargetUserId] = useState<number | "">("");

  // Deletion state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  // Upload file logic
  const uploadFile = async (file: File) => {
    // Max size: 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً! الحد الأقصى هو 50 ميجابايت.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId.toString());
    formData.append("senderName", senderName);
    formData.append("scope", scope);
    formData.append("visibility", visibility);
    if (visibility === "SPECIFIC_USER" && targetUserId) {
      formData.append("targetUserId", targetUserId.toString());
    }

    try {
      setUploadProgress(30);
      const res = await fetch("/api/network/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.share) {
          setFiles((prev) => [data.share, ...prev]);
          toast.success(`تمت مشاركة الملف "${file.name}" بنجاح`);
        } else {
          toast.error(data.error || "فشل رفع الملف");
        }
      } else {
        toast.error("فشل رفع الملف إلى خادم الشبكة المحلية");
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete flow
  const handleDeleteClick = (id: number, filename: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(filename);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;

    setIsConfirmOpen(false);
    const res = await deleteSharedFile(deleteTargetId);

    if (res.success) {
      toast.success("تم حذف الملف المشترك بنجاح");
      setFiles((prev) => prev.filter((f) => f.id !== deleteTargetId));
    } else {
      toast.error("فشل حذف الملف");
    }
    setDeleteTargetId(null);
  };

  // Helper: Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper: Get file extension icon
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
    if (["pdf"].includes(ext || "")) return "📕";
    if (["doc", "docx", "txt", "rtf"].includes(ext || "")) return "📄";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "📊";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) return "📦";
    return "📁";
  };

  // Filtered shared files list
  const filteredFiles = files.filter(
    (f) =>
      f.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className="p-8 min-h-screen text-slate-100 bg-slate-950 font-sans"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Icons.Grid className="w-8 h-8" />
            </span>
            بوابة تبادل الملفات المحلية السريعة
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            بوابة محلية تتيح رفع وتبادل الملفات بين الأجهزة المتصلة بالمحطة دون
            وسائط خارجية.
          </p>
        </div>

        {backUrl && (
          <div>
            <a
              href={backUrl}
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2 font-bold text-sm"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              {sectionLabel || "العودة لمنظومة الشبكة"}
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Dropzone & Sender Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload File Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed p-8 shadow-2xl flex flex-col items-center justify-center text-center transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-500/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <Icons.Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-white mb-2">
              اسحب الملف وأفلته هنا للمشاركة
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-6">
              أو اختر ملفاً يدوياً من جهازك (الحد الأقصى: 50MB)
            </p>

            {isManager && (
              <div className="w-full text-right mb-6 space-y-4 px-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    صلاحية الوصول ومشاركة الملف:
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="EVERYONE">مشاركة مع الجميع</option>
                    <option value="MANAGERS">المدراء فقط</option>
                    <option value="DEPARTMENT">موضفي القسم فقط</option>
                    <option value="SPECIFIC_USER">مستخدم محدد</option>
                  </select>
                </div>

                {visibility === "SPECIFIC_USER" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      اختر المستخدم:
                    </label>
                    <select
                      value={targetUserId}
                      onChange={(e) =>
                        setTargetUserId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full bg-slate-800 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- يرجى اختيار مستخدم --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <label className="cursor-pointer px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20">
              اختر ملفاً
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {isUploading && (
              <div className="mt-6 w-full space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-400">
                  <span>جاري رفع ومشاركة الملف...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Shared Files list */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                📂 الملفات المشتركة حالياً بالشبكة
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                اضغط تحميل لتنزيل الملف أو حذفه إذا كنت مديراً.
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="بحث في الملفات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white focus:border-indigo-500 outline-none transition-all"
              />
              <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-3.5" />
            </div>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.length === 0 ? (
              <div className="col-span-1 md:col-span-2 py-16 text-center text-slate-500 font-bold text-sm">
                لا توجد ملفات مشتركة حالياً.
              </div>
            ) : (
              filteredFiles.map((f) => (
                <div
                  key={f.id}
                  className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex items-start gap-4"
                >
                  <span className="text-2xl p-3 bg-white/5 rounded-2xl flex-shrink-0">
                    {getFileIcon(f.fileName)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-white text-sm truncate"
                      title={f.fileName}
                    >
                      {f.fileName}
                    </h4>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-medium">
                      <span>{formatBytes(f.sizeBytes)}</span>
                      <span>•</span>
                      <span>بواسطة: {f.creatorName || "جهاز محلي"}</span>
                      <span>•</span>
                      <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {f.visibility === "EVERYONE"
                          ? "للجميع"
                          : f.visibility === "MANAGERS"
                            ? "للمدراء"
                            : f.visibility === "DEPARTMENT"
                              ? "للقسم"
                              : "لمستخدم محدد"}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">
                      {new Date(f.createdAt).toLocaleString("ar-EG")}
                    </span>

                    <div className="flex items-center gap-2 mt-4">
                      <a
                        href={f.fileUrl}
                        download
                        className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                      >
                        📥 تحميل
                      </a>

                      <button
                        onClick={() => handleDeleteClick(f.id, f.fileName)}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف الملف المشترك"
        description={`هل أنت متأكد من رغبتك في حذف ملف "${deleteTargetName}" نهائياً من خادم الملفات بالشبكة؟`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
