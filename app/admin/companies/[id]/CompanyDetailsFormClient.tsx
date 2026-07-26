"use client";

import React, { useState } from "react";
import { updateCompanyDetails } from "@/app/actions/companies";
import { toast } from "sonner";
import { Icons } from "@/components/ui/Icons";
import { MapPickerModal } from "@/components/ui/MapPickerModal";
import { BidiText } from "@/components/ui/BidiText";

interface CompanyDetailsFormProps {
  company: {
    id: number;
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

export function CompanyDetailsFormClient({ company }: CompanyDetailsFormProps) {
  const [name, setName] = useState(company.name);
  const [address, setAddress] = useState(company.address || "");
  const [phone, setPhone] = useState(company.phone || "");
  const [latitude, setLatitude] = useState(
    company.latitude ? String(company.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    company.longitude ? String(company.longitude) : "",
  );

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم الشركة حقل مطلوب.");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("جاري حفظ التغييرات...");
    try {
      const lat = latitude.trim() ? parseFloat(latitude) : null;
      const lng = longitude.trim() ? parseFloat(longitude) : null;

      if (
        (latitude.trim() && isNaN(lat as number)) ||
        (longitude.trim() && isNaN(lng as number))
      ) {
        throw new Error("إحداثيات موقع المعمل غير صالحة. يجب أن تكون أرقاماً.");
      }

      const res = await updateCompanyDetails(company.id, {
        name,
        address: address.trim() || null,
        phone: phone.trim() || null,
        latitude: lat,
        longitude: lng,
      });

      if (res.success) {
        toast.success("تم تحديث بيانات الشركة بنجاح.", { id: loadingToast });
      } else {
        toast.error(res.error || "فشل تحديث البيانات.", { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع.", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectLocation = (
    lat: number,
    lng: number,
    resolvedAddress?: string,
  ) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    if (resolvedAddress && !address) {
      setAddress(resolvedAddress);
    }
    toast.success("تم تحديد إحداثيات موقع المعمل من الخريطة.");
  };

  return (
    <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Icons.Briefcase className="w-5 h-5 text-blue-500" />
        تفاصيل بيانات الشركة
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="companyName"
            className="text-sm font-medium text-slate-400"
          >
            اسم الشركة / المنشأة
          </label>
          <input
            id="companyName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
            required
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label
            htmlFor="companyAddress"
            className="text-sm font-medium text-slate-400"
          >
            العنوان الجغرافي / الوصفي
          </label>
          <input
            id="companyAddress"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
            placeholder="مثال: البصرة — المنطقة الصناعية"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label
            htmlFor="companyPhone"
            className="text-sm font-medium text-slate-400"
          >
            هاتف الاتصال
          </label>
          <input
            id="companyPhone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
            placeholder="0770..."
          />
        </div>

        {/* Coordinates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="companyLat"
              className="text-sm font-medium text-slate-400"
            >
              خط العرض (Latitude)
            </label>
            <input
              id="companyLat"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold text-sm ltr text-left"
              placeholder="30.5012"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="companyLng"
              className="text-sm font-medium text-slate-400"
            >
              خط الطول (Longitude)
            </label>
            <input
              id="companyLng"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold text-sm ltr text-left"
              placeholder="47.8123"
            />
          </div>
        </div>

        {/* Map Trigger button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/10 rounded-xl text-sm font-bold text-indigo-400 flex items-center justify-center gap-2 transition-all"
          >
            <Icons.Navigation className="w-4 h-4" />
            تحديد موقع المعمل من الخريطة
          </button>
        </div>

        <div className="space-y-2 opacity-60">
          <label
            htmlFor="companySlug"
            className="text-sm font-medium text-slate-500"
          >
            المعرف التقني للشركة (Slug)
          </label>
          <input
            id="companySlug"
            disabled
            value={company.slug}
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed font-mono text-left text-sm"
            dir="ltr"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-blue-600/10 text-sm"
          >
            {submitting ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>

      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLat={latitude ? parseFloat(latitude) : undefined}
        initialLng={longitude ? parseFloat(longitude) : undefined}
        isAr={true}
      />
    </div>
  );
}
