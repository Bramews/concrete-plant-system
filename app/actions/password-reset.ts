"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// إنشاء token لإعادة تعيين كلمة المرور
export async function requestPasswordReset(email: string) {
  // البحث عن المستخدم بالإيميل
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // لا نكشف إذا كان الإيميل موجود أم لا (أمان)
    return {
      success: true,
      message: "إذا كان الإيميل موجوداً، سيتم إرسال رابط إعادة التعيين",
    };
  }

  // حذف أي tokens سابقة
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // إنشاء token جديد
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  // إرسال الإيميل
  if (process.env.RESEND_API_KEY) {
    // إرسال إيميل حقيقي عبر Resend
    try {
      await sendPasswordResetEmail(user.email, token, user.name);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  } else {
    // طباعة الرابط في الـ console للاختبار (بدون API key)
    console.log("===========================================");
    console.log("🔑 PASSWORD RESET LINK (for testing):");
    console.log(resetUrl);
    console.log("===========================================");
  }

  return {
    success: true,
    message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
  };
}

// التحقق من صلاحية الـ token
export async function validateResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { valid: false, error: "رابط غير صالح" };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, error: "انتهت صلاحية الرابط" };
  }

  return {
    valid: true,
    user: { id: resetToken.user.id, name: resetToken.user.name },
  };
}

// إعادة تعيين كلمة المرور
export async function resetPassword(token: string, newPassword: string) {
  const validation = await validateResetToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // تشفير كلمة المرور الجديدة
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // تحديث كلمة المرور
  await prisma.user.update({
    where: { id: validation.user!.id },
    data: {
      password: hashedPassword,
    },
  });

  // حذف الـ token لمنع إعادة الاستخدام
  await prisma.passwordResetToken.delete({
    where: { token },
  });

  return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
}
