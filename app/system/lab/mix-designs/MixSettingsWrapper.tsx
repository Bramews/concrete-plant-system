"use client";

import { useState } from "react";
import MixSettingsPanel from "@/components/lab/MixSettingsPanel";
import { useRouter } from "next/navigation";

interface MixSettingsWrapperProps {
  initialSettings: Record<string, string>;
  standards: any[];
}

export default function MixSettingsWrapper({
  initialSettings,
  standards,
}: MixSettingsWrapperProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Remove the query param to go back to the main list
    router.push("/system/lab/mix-designs");
  };

  return (
    <MixSettingsPanel
      isOpen={isOpen}
      onClose={handleClose}
      initialSettings={initialSettings}
      standards={standards}
      onRefresh={() => router.refresh()}
    />
  );
}
