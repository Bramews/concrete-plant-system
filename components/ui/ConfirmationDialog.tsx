"use client";

import { Icons } from "@/components/ui/Icons";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: "danger" | "info" | "warning" | "success";
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
  secondaryText?: string;
  onSecondary?: () => void;
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "danger",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  isPending = false,
  requireCheckbox = false,
  checkboxLabel = "أوافق على الإجراء",
  secondaryText,
  onSecondary,
  children,
}: ConfirmationDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(isOpen);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setShow(isOpen);
    if (!isOpen) setChecked(false);
  }, [isOpen]);

  if (!show || !mounted) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />,
          buttonBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20",
          iconBg: "bg-rose-500/10 border border-rose-500/20",
        };
      case "warning":
        return {
          icon: <Icons.AlertCircle className="w-6 h-6 text-amber-500" />,
          buttonBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20",
          iconBg: "bg-amber-500/10 border border-amber-500/20",
        };
      case "success":
        return {
          icon: <Icons.CheckCircle className="w-6 h-6 text-emerald-400" />,
          buttonBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20",
          iconBg: "bg-emerald-500/10 border border-emerald-500/20",
        };
      case "info":
      default:
        return {
          icon: <Icons.Info className="w-6 h-6 text-indigo-400" />,
          buttonBg: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20",
          iconBg: "bg-indigo-500/10 border border-indigo-500/20",
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      <div className="relative bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 backdrop-blur-3xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-3 rounded-full ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-black text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-bold">
                {description}
              </p>
              {children && <div className="mt-4">{children}</div>}

              {requireCheckbox && (
                <label className="mt-6 flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group">
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      checked
                        ? "bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/20"
                        : "border-white/10 group-hover:border-white/20"
                    }`}
                    onClick={() => setChecked(!checked)}
                  >
                    {checked && <Icons.Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {checkboxLabel}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black/20 px-8 py-6 flex gap-4 justify-end items-center border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 text-sm font-bold font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || (requireCheckbox && !checked)}
            className={`px-8 py-3 text-sm font-bold font-black uppercase tracking-[0.2em] text-white rounded-2xl shadow-2xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ${
              requireCheckbox && !checked
                ? "bg-slate-800 grayscale"
                : styles.buttonBg
            }`}
          >
            {isPending ? (
              <>
                <Icons.Loader className="w-4 h-4 animate-spin" />
                <span>جاري التنفيذ...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>

          {onSecondary && secondaryText && (
            <button
              type="button"
              onClick={onSecondary}
              disabled={isPending || (requireCheckbox && !checked)}
              className="px-8 py-3 text-sm font-bold font-black uppercase tracking-[0.2em] text-white rounded-2xl shadow-2xl transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
            >
              {secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
