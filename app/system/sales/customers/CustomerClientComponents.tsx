"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  deleteCustomer,
  createCustomer,
  updateCustomer,
} from "@/app/actions/customer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateCustomerButton({ isRtl }: { isRtl: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCustomer(formData);
      toast.success(isRtl ? "تمت الإضافة بنجاح" : "Added successfully");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {isRtl ? "إضافة زبون جديد" : "Add Customer"}
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="bg-slate-900 border border-border rounded-3xl w-full max-w-md p-6 relative">
              <h2 className="text-xl font-bold text-white mb-6">
                {isRtl ? "إضافة زبون جديد" : "Add New Customer"}
              </h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "اسم الزبون / الشركة *" : "Customer Name *"}
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    name="phone"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "العنوان" : "Address"}
                  </label>
                  <input
                    name="address"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {loading
                      ? isRtl
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : isRtl
                        ? "حفظ الزبون"
                        : "Save Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function CustomerActionsMenu({
  customer,
  isRtl,
}: {
  customer: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  isRtl: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function handleDelete() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("id", String(customer.id));
      await deleteCustomer(fd);
      toast.success(isRtl ? "تم الحذف بنجاح" : "Deleted successfully");
      setShowConfirm(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("id", String(customer.id));
      await updateCustomer(formData);
      toast.success(isRtl ? "تم التعديل بنجاح" : "Updated successfully");
      setShowEdit(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.preventDefault()}
    >
      <button
        onClick={() => setShowEdit(true)}
        disabled={loading}
        title={isRtl ? "تعديل العميل" : "Edit Customer"}
        className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        title={isRtl ? "حذف العميل" : "Delete Customer"}
        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showConfirm &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="bg-slate-900 border border-red-500/20 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl shadow-red-500/10">
              <h2 className="text-xl font-bold text-white mb-2 text-center">
                {isRtl ? "تأكيد الحذف" : "Confirm Delete"}
              </h2>
              <p className="text-slate-400 text-center mb-6 text-sm">
                {isRtl
                  ? "هل أنت متأكد من أرشفة/حذف هذا العميل؟"
                  : "Are you sure you want to delete this customer?"}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-600/20"
                >
                  {loading
                    ? isRtl
                      ? "جاري الحذف..."
                      : "Deleting..."
                    : isRtl
                      ? "نعم، متأكد"
                      : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showEdit &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="bg-slate-900 border border-border rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">
                {isRtl ? "تعديل بيانات العميل" : "Edit Customer"}
              </h2>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "اسم الزبون / الشركة *" : "Customer Name *"}
                  </label>
                  <input
                    name="name"
                    defaultValue={customer.name}
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    name="phone"
                    defaultValue={customer.phone || ""}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={customer.email || ""}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {isRtl ? "العنوان" : "Address"}
                  </label>
                  <input
                    name="address"
                    defaultValue={customer.address || ""}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {loading
                      ? isRtl
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : isRtl
                        ? "حفظ التعديلات"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
