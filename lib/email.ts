import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailResult {
  success: boolean;
  error?: string;
}

const BASE_STYLES = `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;`;
const HEADER_STYLES = `background-color: #4f46e5; padding: 20px; text-align: center;`;
const BODY_STYLES = `padding: 30px;`;
const BUTTON_STYLES = `display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;`;
const FOOTER_STYLES = `background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;`;

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
): Promise<EmailResult> {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `تفعيل حسابك في النظام`,
      html: `
        <div dir="rtl" style="${BASE_STYLES}">
          <div style="${HEADER_STYLES}">
            <h1 style="color: #ffffff; margin: 0;">تفعيل الحساب</h1>
          </div>
          <div style="${BODY_STYLES}">
            <p style="font-size: 16px;">مرحباً <strong>${name}</strong>،</p>
            <p>لقد تمت دعوتك للانضمام إلى نظام الخرسانة كمدير للشركة.</p>
            <p>لإكمال عملية التسجيل وتعيين كلمة المرور الخاصة بك، يرجى الضغط على الزر أدناه:</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${verifyUrl}" style="${BUTTON_STYLES}">تفعيل الحساب وتعيين كلمة المرور</a>
            </p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              إذا لم تقم بطلب هذا الحساب، يمكنك تجاهل هذه الرسالة.
            </p>
          </div>
          <div style="${FOOTER_STYLES}">
            &copy; ${new Date().getFullYear()} Concrete Plant System. جميع الحقوق محفوظة.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error (Verification):", error);
      return { success: false, error: (error as Error).message };
    }
    return { success: true };
  } catch (err) {
    console.error("Unexpected Email Error:", err);
    return { success: false, error: "Failed to send verification email" };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string,
): Promise<EmailResult> {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `إعادة تعيين كلمة المرور`,
      html: `
        <div dir="rtl" style="${BASE_STYLES}">
          <div style="${HEADER_STYLES}">
            <h1 style="color: #ffffff; margin: 0;">إعادة تعيين كلمة المرور</h1>
          </div>
          <div style="${BODY_STYLES}">
            <p style="font-size: 16px;">مرحباً <strong>${name}</strong>،</p>
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
            <p>اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${resetUrl}" style="${BUTTON_STYLES}">إعادة تعيين كلمة المرور</a>
            </p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              رابط إعادة التعيين صالح لمدة ساعة واحدة.<br>
              إذا لم تطلب هذا التغيير، يرجى تجاهل الرسالة.
            </p>
          </div>
          <div style="${FOOTER_STYLES}">
            &copy; ${new Date().getFullYear()} Concrete Plant System. جميع الحقوق محفوظة.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error (Reset):", error);
      return { success: false, error: (error as Error).message };
    }
    return { success: true };
  } catch (err) {
    console.error("Unexpected Email Error:", err);
    return { success: false, error: "Failed to send reset email" };
  }
}

export async function sendBackupAlertEmail(
  to: string,
  status: "SUCCESS" | "FAILED",
  details: {
    filename?: string;
    sizeBytes?: number;
    error?: string;
    type: string;
  },
): Promise<EmailResult> {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const subject =
    status === "SUCCESS"
      ? `🟢 نجاح النسخ الاحتياطي للنظام - ${details.type}`
      : `🔴 فشل النسخ الاحتياطي للنظام - ${details.type}`;

  const sizeMB = details.sizeBytes
    ? (details.sizeBytes / (1024 * 1024)).toFixed(2)
    : "0";

  const htmlContent = `
    <div dir="rtl" style="${BASE_STYLES}">
      <div style="background-color: ${status === "SUCCESS" ? "#10b981" : "#ef4444"}; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">تقرير النسخ الاحتياطي للنظام</h1>
      </div>
      <div style="${BODY_STYLES}">
        <p style="font-size: 16px;">مرحباً المسؤول،</p>
        <p>نود إعلامك بحالة عملية النسخ الاحتياطي الجارية:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #666;">الحالة:</td>
            <td style="padding: 10px; font-weight: bold; color: ${status === "SUCCESS" ? "#10b981" : "#ef4444"};">
              ${status === "SUCCESS" ? "ناجحة 🟢" : "فاشلة 🔴"}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #666;">النوع:</td>
            <td style="padding: 10px; color: #333;">${details.type}</td>
          </tr>
          ${
            status === "SUCCESS"
              ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #666;">اسم الملف:</td>
            <td style="padding: 10px; color: #333; font-family: monospace;">${details.filename}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #666;">الحجم الفعلي:</td>
            <td style="padding: 10px; color: #333;">${sizeMB} ميغابايت</td>
          </tr>
          `
              : `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #666;">سبب الفشل:</td>
            <td style="padding: 10px; color: #ef4444;">${details.error}</td>
          </tr>
          `
          }
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #666;">وقت التنفيذ:</td>
            <td style="padding: 10px; color: #333;">${new Date().toLocaleString("ar-EG")}</td>
          </tr>
        </table>
      </div>
      <div style="${FOOTER_STYLES}">
        &copy; ${new Date().getFullYear()} Concrete Plant System. جميع الحقوق محفوظة.
      </div>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: htmlContent,
    });
    if (error) return { success: false, error: (error as Error).message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
