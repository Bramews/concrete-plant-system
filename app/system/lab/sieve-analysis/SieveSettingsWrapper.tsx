"use client";

import { useRouter, usePathname } from "next/navigation";
import SieveSettingsPanel from "@/components/lab/SieveSettingsPanel";

interface SieveSettingsWrapperProps {
  standards: any[];
  materials: any[];
}

export default function SieveSettingsWrapper({
  standards,
  materials,
}: SieveSettingsWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SieveSettingsPanel
      isOpen={true}
      onClose={() => {
        router.push(pathname);
      }}
      standards={standards}
      materials={materials}
      onRefresh={() => {
        router.refresh();
      }}
    />
  );
}
