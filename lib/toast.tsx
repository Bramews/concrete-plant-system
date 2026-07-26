"use client";

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

export const Toaster = SonnerToaster;

export const toast = {
  success: (msg: string, options?: any) => {
    sonnerToast.success(msg, options);
    return msg;
  },
  error: (msg: string, options?: any) => {
    sonnerToast.error(msg, options);
    return msg;
  },
  loading: (msg: string, options?: any) => {
    return sonnerToast.loading(msg, options);
  },
  promise: <T,>(promise: Promise<T> | (() => Promise<T>), data?: any) => {
    return sonnerToast.promise(promise, data);
  },
  dismiss: (id?: any) => {
    sonnerToast.dismiss(id);
  },
  info: (msg: string, options?: any) => {
    sonnerToast.info(msg, options);
    return msg;
  },
  warning: (msg: string, options?: any) => {
    sonnerToast.warning(msg, options);
    return msg;
  },
};
