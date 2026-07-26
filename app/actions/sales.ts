"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const DATA_DIR = path.join(process.cwd(), "data");
const DEALS_FILE = path.join(DATA_DIR, "crm-deals.json");
const QUOTES_FILE = path.join(DATA_DIR, "crm-quotes.json");
const PRICES_FILE = path.join(DATA_DIR, "approved-prices.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

export async function getApprovedPrices(): Promise<Record<string, number>> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PRICES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // Default prices list if file not ready
    return {
      C20: 65000,
      C25: 68000,
      C30: 72000,
      C40: 80000,
    };
  }
}

/* ───────────────────────────────────────────────────────────
   CRM DEALS ACTIONS
   ─────────────────────────────────────────────────────────── */

export interface DealItem {
  id: number;
  customerName: string;
  projectName: string;
  value: number;
  stage:
    | "LEAD"
    | "CONTACTED"
    | "PROPOSAL"
    | "NEGOTIATING"
    | "WON"
    | "CANCELLED";
  phone: string;
}

const DEFAULT_DEALS: DealItem[] = [
  {
    id: 1,
    customerName: "شركة البنيان للإعمار",
    projectName: "مجمع نينوى السكني",
    value: 45000000,
    stage: "LEAD",
    phone: "07701234567",
  },
  {
    id: 2,
    customerName: "مكتب آشور الهندسي",
    projectName: "جسر الكحلاء الجديد",
    value: 120000000,
    stage: "CONTACTED",
    phone: "07801234567",
  },
  {
    id: 3,
    customerName: "شركة بابل العامة",
    projectName: "طريق الدورة السريع",
    value: 85000000,
    stage: "PROPOSAL",
    phone: "07901234567",
  },
  {
    id: 4,
    customerName: "مجموعة حمورابي",
    projectName: "فندق السدير السياحي",
    value: 150000000,
    stage: "NEGOTIATING",
    phone: "07501234567",
  },
  {
    id: 5,
    customerName: "وزارة الإعمار والإسكان",
    projectName: "مستشفى البصرة العام",
    value: 320000000,
    stage: "WON",
    phone: "07712345678",
  },
];

export async function getDeals(): Promise<DealItem[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DEALS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // Create with default data
      await fs.writeFile(
        DEALS_FILE,
        JSON.stringify(DEFAULT_DEALS, null, 2),
        "utf-8",
      );
      return DEFAULT_DEALS;
    }
    console.error("Error reading deals:", err);
    return DEFAULT_DEALS;
  }
}

export async function saveDeal(deal: Omit<DealItem, "id"> & { id?: number }) {
  await ensureDataDir();
  const deals = await getDeals();
  const newDeal: DealItem = {
    id: deal.id || Date.now(),
    customerName: deal.customerName,
    projectName: deal.projectName,
    value: deal.value,
    stage: deal.stage,
    phone: deal.phone,
  };

  const index = deals.findIndex((d) => d.id === newDeal.id);
  if (index !== -1) {
    deals[index] = newDeal;
  } else {
    deals.push(newDeal);
  }

  await fs.writeFile(DEALS_FILE, JSON.stringify(deals, null, 2), "utf-8");
  revalidatePath("/system/sales/orders");
  return { success: true, deal: newDeal };
}

export async function deleteDeal(id: number) {
  await ensureDataDir();
  let deals = await getDeals();
  deals = deals.filter((d) => d.id !== id);
  await fs.writeFile(DEALS_FILE, JSON.stringify(deals, null, 2), "utf-8");
  revalidatePath("/system/sales/orders");
  return { success: true };
}

/* ───────────────────────────────────────────────────────────
   SALES QUOTES ACTIONS
   ─────────────────────────────────────────────────────────── */

export interface QuoteItem {
  id: string;
  customerName: string;
  projectName: string;
  mixGrade: string;
  volume: number;
  distance: number;
  includePump: boolean;
  additionalAdmixture: boolean;
  grandTotal: number;
  createdAt: string;
}

export async function getQuotes(): Promise<QuoteItem[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(QUOTES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await fs.writeFile(QUOTES_FILE, "[]", "utf-8");
      return [];
    }
    console.error("Error reading quotes:", err);
    return [];
  }
}

export async function saveQuote(
  quote: Omit<QuoteItem, "id" | "createdAt"> & { id?: string },
) {
  await ensureDataDir();
  const quotes = await getQuotes();
  const newQuote: QuoteItem = {
    id: quote.id || `QT-${Date.now()}`,
    customerName: quote.customerName,
    projectName: quote.projectName,
    mixGrade: quote.mixGrade,
    volume: quote.volume,
    distance: quote.distance,
    includePump: quote.includePump,
    additionalAdmixture: quote.additionalAdmixture,
    grandTotal: quote.grandTotal,
    createdAt: new Date().toISOString(),
  };

  const index = quotes.findIndex((q) => q.id === newQuote.id);
  if (index !== -1) {
    quotes[index] = newQuote;
  } else {
    quotes.unshift(newQuote);
  }

  await fs.writeFile(QUOTES_FILE, JSON.stringify(quotes, null, 2), "utf-8");
  revalidatePath("/system/sales/orders");
  return { success: true, quote: newQuote };
}

export async function deleteQuote(id: string) {
  await ensureDataDir();
  let quotes = await getQuotes();
  quotes = quotes.filter((q) => q.id !== id);
  await fs.writeFile(QUOTES_FILE, JSON.stringify(quotes, null, 2), "utf-8");
  revalidatePath("/system/sales/orders");
  return { success: true };
}
