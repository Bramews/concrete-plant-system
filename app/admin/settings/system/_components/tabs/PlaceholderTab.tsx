interface PlaceholderTabProps {
  tabName: string;
}

export function PlaceholderTab({ tabName }: PlaceholderTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="p-6 rounded-full bg-slate-800 border border-slate-700 mb-6">
        <svg
          className="w-12 h-12 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{tabName}</h3>
      <p className="text-slate-400 text-center max-w-md">
        هذا التبويب قيد التطوير حالياً. يمكن إضافة الإعدادات المطلوبة لاحقاً.
      </p>
    </div>
  );
}
