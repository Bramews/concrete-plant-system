import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 1. تشغيل سيرفر Next.js المباشر
console.log('🚀 بدء تشغيل المشروع (Next.js Server)...');
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
});

// التعامل مع إيقاف العملية (Ctrl + C)
process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
  process.exit();
});
process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit();
});
