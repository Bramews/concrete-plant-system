import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "الرجاء تسجيل الدخول أولاً" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "لم يتم إرسال ملف صوتي" },
        { status: 400 },
      );
    }

    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Try to send to the persistent local voice service (blazing fast, pre-loaded model)
    try {
      const response = await fetch("http://127.0.0.1:5001/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
        },
        body: buffer,
        // Short timeout/signal can be added if needed, but fetch is local
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return NextResponse.json(data);
        }
      }
    } catch (serviceErr) {
      console.warn(
        "Local persistent voice service not running, falling back to cold-start script:",
        serviceErr,
      );
    }

    // 2. Fallback: Save uploaded file to tmp and run cold-start python script
    const tempWavPath = path.join(
      tmpDir,
      `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.wav`,
    );
    fs.writeFileSync(tempWavPath, buffer);

    try {
      // Execute the offline transcription Python script
      const pythonScript = path.join(
        process.cwd(),
        "scripts",
        "transcribe_offline.py",
      );

      // Call python to transcribe the wav file
      const { stdout } = await execAsync(
        `python "${pythonScript}" "${tempWavPath}"`,
      );

      // Parse output
      let result = { success: false, error: "فشل التعرف الصوتي المحلي" };
      try {
        result = JSON.parse(stdout.trim());
      } catch (e) {
        console.error("Failed to parse python transcribe stdout:", stdout, e);
      }

      // Cleanup
      if (fs.existsSync(tempWavPath)) {
        fs.unlinkSync(tempWavPath);
      }

      return NextResponse.json(result);
    } catch (cmdErr: unknown) {
      console.error(
        "Local python transcription command execution failed:",
        cmdErr,
      );

      // Cleanup
      if (fs.existsSync(tempWavPath)) {
        fs.unlinkSync(tempWavPath);
      }

      return NextResponse.json(
        {
          success: false,
          error: `خطأ في المعالجة المحلية: ${(cmdErr as Error).message || String(cmdErr)}`,
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error("Offline transcribe API failed:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ داخلي أثناء معالجة الصوت" },
      { status: 500 },
    );
  }
}
