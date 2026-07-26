import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BidiText } from "@/components/ui/BidiText";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Truck,
  User,
  Hash,
  Layers,
} from "lucide-react";

interface VerifyPageProps {
  params: Promise<{ hash: string }>;
}

export default async function VerifyDeliveryPage({ params }: VerifyPageProps) {
  const { hash: deliveryHash } = await params;

  // Fetch ticket details
  const ticket = await prisma.deliveryTicket.findUnique({
    where: { deliveryHash },
    include: {
      order: {
        include: {
          company: true,
          mixDesign: true,
        },
      },
    },
  });

  if (!ticket) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-right"
        dir="rtl"
      >
        <div className="bg-slate-900 border border-red-500/20 max-w-md w-full rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">تذكرة غير معروفة</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              عذراً، لم نتمكن من العثور على أي شحنة مطابقة لهذه البصمة الرقمية.
              يرجى التأكد من صحة الرابط أو رمز الـ QR.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <BidiText className="text-xs text-slate-600 select-all block break-all font-mono">
              {deliveryHash}
            </BidiText>
          </div>
        </div>
      </div>
    );
  }

  const companyName = ticket.order.company?.name || "مصنع الخرسانة";
  const mixGrade = ticket.order.mixDesign?.grade || "C30/37";
  const mixCode = ticket.order.mixDesign?.code || "MIX-CODE";

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 md:p-8"
      dir="rtl"
    >
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 max-w-2xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Verification Status Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-8 text-center border-b border-emerald-500/10 space-y-4">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              وثيقة معتمدة ومطابقة
            </span>
            <h1 className="text-3xl font-black text-white pt-2">
              {companyName}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              تذكرة توصيل خرسانة جاهزة موثقة رقمياً
            </p>
          </div>
        </div>

        {/* Ticket Details Panel */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ticket Info Card */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Hash className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold">معلومات التذكرة</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">رقم التذكرة</span>
                  <BidiText className="font-mono font-bold text-white">
                    {ticket.ticketNumber}
                  </BidiText>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">رقم الطلب</span>
                  <BidiText className="font-mono font-bold text-white">
                    {ticket.order.orderNumber}
                  </BidiText>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">كود الخلطة</span>
                  <BidiText className="font-mono font-bold text-white">
                    {mixCode}
                  </BidiText>
                </div>
              </div>
            </div>

            {/* Load Specs Card */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold">مواصفات الشحنة</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">رتبة الخرسانة</span>
                  <BidiText className="font-bold text-white">
                    {mixGrade}
                  </BidiText>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">الكمية المطلوبة</span>
                  <span className="font-bold text-white">
                    {ticket.order.volume} م³
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">الكمية التراكمية</span>
                  <span className="font-bold text-white">
                    {ticket.cumulativeQuantity} م³
                  </span>
                </div>
              </div>
            </div>

            {/* Logistics Card */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Truck className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">الخدمات اللوجستية</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">رقم الشاحنة</span>
                  <BidiText className="font-bold text-white">
                    {ticket.truckNumber}
                  </BidiText>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">اسم السائق</span>
                  <span className="font-bold text-white">
                    {ticket.driverName}
                  </span>
                </div>
              </div>
            </div>

            {/* Timing Card */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold">التوقيت والزمن</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">تاريخ الإصدار</span>
                  <span className="font-bold text-white">
                    {ticket.createdAt.toLocaleDateString("ar-IQ", {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">وقت التحميل</span>
                  <span className="font-bold text-white" dir="ltr">
                    {ticket.createdAt.toLocaleTimeString("ar-IQ", {
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Box */}
          <div className="bg-slate-950/80 border border-white/5 p-6 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              البصمة الرقمية والتوقيع المشفر (DNA Proof)
            </h3>
            <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl font-mono text-xs text-emerald-400 break-all select-all leading-relaxed">
              <BidiText>{deliveryHash}</BidiText>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              * تم توليد هذه البصمة باستخدام خوارزمية SHA-256 وربطها بسلسلة
              تتابعية لمنع تعديل البيانات بأثر رجعي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
