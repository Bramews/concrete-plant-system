import { getPublicVerifiedTicket } from "@/app/actions/public-verify";
import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default async function PublicVerifyPage({
  params,
}: {
  params: { id: string };
}) {
  const ticket = await getPublicVerifiedTicket(params.id);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
          <Icons.X className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">
          تذكرة غير موجودة
        </h1>
        <p className="text-slate-400">
          عذراً، لم نتمكن من العثور على تذكرة بهذا الرقم في نظامنا.
        </p>
        <div className="mt-8">
          <p className="text-sm font-bold text-slate-700 font-bold uppercase tracking-widest leading-none opacity-50">
            Concrete Intel Verification System
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Premium Digital Ticket */}
      <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 pb-4 relative z-10 text-center">
          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-8 animate-in zoom-in-50 duration-500">
            <Icons.Check className="w-4 h-4" />
            <span className="text-sm font-bold font-black uppercase tracking-widest ltr">
              Verified Batch
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">
              وصل توريد إلكتروني
            </h1>
            <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
              Digital Delivery Receipt
            </p>
          </div>

          {/* QR Code Placeholder (Simulated) */}
          <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl shadow-xl ring-8 ring-white/5 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://chart.googleapis.com/chart?chs=128x128&cht=qr&chl=https://concrete-intel.com/verify/${ticket.id}`}
              alt="Verification QR"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Ticket Details - Dashed line separator */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 -ml-4 border border-white/5" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 -mr-4 border border-white/5" />
          <div className="border-t-4 border-dashed border-slate-800 my-4 opacity-50" />
        </div>

        <div className="p-10 space-y-6 pt-6">
          <TicketDetail label="اسم العميل" value={ticket.customerName} />
          <TicketDetail label="المشروع" value={ticket.projectName} />
          <TicketDetail label="رقم التذكرة" value={`#DT-${ticket.id}`} />
          <TicketDetail label="كود الخلطة" value={ticket.mixCode} />
          <TicketDetail
            label="الرتبة التصميمية"
            value={
              <span className="text-indigo-400 font-black">
                {ticket.strengthClass}
              </span>
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <TicketDetail label="الكمية" value={`${ticket.quantity} m³`} />
            <TicketDetail label="رقم الشاحنة" value={ticket.truckNumber} />
          </div>

          <TicketDetail
            label="وقت التحميل"
            value={format(new Date(ticket.batchTime), "PPpp", { locale: ar })}
          />
        </div>

        {/* Footer branding */}
        <div className="bg-slate-950/50 p-6 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-white text-[8px] font-black">
              C
            </div>
            <span className="text-sm font-bold text-white font-black tracking-widest uppercase">
              Concrete Intel Platform
            </span>
          </div>
          <p className="text-[8px] text-slate-600 font-bold">
            تم التحقق من البيانات مباشرة من قاعدة بيانات الشركة
          </p>
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1 text-right">
      <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm text-slate-200 font-bold">{value}</p>
    </div>
  );
}
