import { requireRole, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  QrCode,
  ExternalLink,
  Printer,
  ShieldCheck,
} from "lucide-react";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ACCOUNTANT", "MANAGER"]);
  const session = await getSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true,
          project: true,
          mixDesign: true,
        },
      },
      ticket: true,
    },
  });

  if (!invoice || invoice.companyId !== session?.companyId) {
    return (
      <div className="p-8 text-red-400 font-bold text-center">
        الفاتورة غير موجودة أو غير مصرح لك بالوصول إليها
      </div>
    );
  }

  const currency = invoice.currency || "IQD";
  const fmt = (n: number) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currency}`;

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "PAID":
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            مدفوعة ومحصلة
          </span>
        );
      case "PENDING":
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            بانتظار التحصيل
          </span>
        );
      case "OVERDUE":
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            متأخرة عن موعد السداد
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            {invoice.status}
          </span>
        );
    }
  };

  const verificationUrl = `/verify/invoice/${invoice.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `https://concrete-plant-system.local${verificationUrl}`,
  )}`;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <Link
          href="/system/accountant/invoices"
          className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all w-fit"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الفواتير</span>
        </Link>
        <Link
          href={verificationUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>فتح شهادة التحقق العامة</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            الفاتورة الإلكترونية المعتمدة
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            #{invoice.id}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Invoice Information */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">العميل</span>
              <span className="text-base font-black text-white block">
                {invoice.order?.customer?.name || "عميل عام"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">المشروع</span>
              <span className="text-base font-bold text-slate-200 block">
                {invoice.order?.project?.name || "—"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">رقم الطلبية</span>
              <span className="text-sm font-mono font-bold text-blue-400 block">
                {invoice.order?.orderNumber || "—"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">تذكرة التسليم</span>
              <span className="text-sm font-mono font-bold text-slate-300 block">
                {invoice.ticket ? `#${invoice.ticket.ticketNumber}` : "فاتورة مباشرة"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">خلطة الخرسانة</span>
              <span className="text-sm font-bold text-slate-300 block">
                {invoice.order?.mixDesign?.code || "—"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">تاريخ الإصدار</span>
              <span className="text-sm font-mono font-bold text-slate-300 block">
                {new Date(invoice.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-bold block">المبلغ الإجمالي للفاتورة</span>
              <span className="text-xs text-slate-500 block">شامل الضريبة المعتمدة</span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
              {fmt(invoice.amount)}
            </div>
          </div>
        </div>

        {/* E-Invoice QR Verification Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col items-center justify-between text-center space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white">رمز التحقق الإلكتروني QR</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              امسح الرمز للتحقق الفوري من صحة الفاتورة وقيمتها المالية عبر بوابة التحقق الرقمية
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrApiUrl}
              alt="QR Code"
              className="w-36 h-36 rounded-lg object-contain"
            />
          </div>

          <div className="w-full pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>فاتورة موثقة رقمياً ومحمية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

