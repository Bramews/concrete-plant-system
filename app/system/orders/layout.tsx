"use client";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="min-h-[500px]">{children}</div>
    </div>
  );
}
