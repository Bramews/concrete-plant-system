"use client";

import { useState } from "react";

export function ConfirmButton({
  onConfirm,
  children,
  message = "Are you sure?",
  className = "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  if (show) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={() => setShow(false)}
      >
        <div
          className="bg-white p-6 rounded shadow-lg max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-4 text-gray-800 font-medium">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShow(false)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                setShow(false);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setShow(true)} className={className}>
      {children}
    </button>
  );
}
