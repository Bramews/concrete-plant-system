"use client";
// ⚠️ غلاف بسيط حول UnifiedSiloDisplay — يمكن الاستغناء عنه

import { Material } from "@prisma/client";
import { UnifiedSiloDisplay } from "@/components/operator/UnifiedSiloDisplay";

interface SiloMonitorProps {
  materials: Material[];
}

export function SiloMonitor({ materials }: SiloMonitorProps) {
  return <UnifiedSiloDisplay materials={materials} compact={true} />;
}
