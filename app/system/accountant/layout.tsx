import { ReactNode } from "react";
import { AccountantNav } from "@/components/accountant/AccountantNav";

export default async function AccountingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <AccountantNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}

