"use client";

import { useState } from "react";
import CubeSettingsPanel from "@/components/lab/CubeSettingsPanel";
import { useRouter } from "next/navigation";

interface CubeSettingsWrapperProps {
  initialSettings: Record<string, string>;
  standards: any[];
}

export default function CubeSettingsWrapper({
  initialSettings,
  standards,
}: CubeSettingsWrapperProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/system/lab/cube-results");
  };

  return (
    <CubeSettingsPanel
      isOpen={isOpen}
      onClose={handleClose}
      initialSettings={initialSettings}
      standards={standards}
      onRefresh={() => router.refresh()}
    />
  );
}
