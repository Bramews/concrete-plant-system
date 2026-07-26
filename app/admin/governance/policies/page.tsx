import { publishPolicyVersion } from "@/app/actions/admin-policy";

export default async function PoliciesPage() {
  return (
    <div className="max-w-[1000px] mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Policy Rules Engine</h1>
        <p className="text-slate-500">
          Versioned control of systemic rules (Behavior Thresholds, Billing
          Limits).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create New Policy Version */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-bold mb-4">Publish New Policy</h2>
          <form
            action={async (formData) => {
              "use server";
              const key = formData.get("key") as string;
              const rules = formData.get("rules") as string;
              const reason = formData.get("reason") as string;
              await publishPolicyVersion(key, rules, reason);
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1 uppercase text-slate-500">
                Policy Key
              </label>
              <select
                title="Policy Key"
                name="key"
                className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-sm"
              >
                <option value="BEHAVIOR_THRESHOLD">Behavior Thresholds</option>
                <option value="BILLING_LIMITS">Billing Limits</option>
                <option value="FEATURE_ACCESS">Feature Access Rules</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1 uppercase text-slate-500">
                Rules (JSON)
              </label>
              <textarea
                title="Policy Rules"
                name="rules"
                rows={6}
                className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 font-mono text-sm font-bold"
                defaultValue='{ "max_errors_per_hour": 50, "auto_flag": true }'
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-1 uppercase text-slate-500">
                Reason for Change (Mandatory)
              </label>
              <input
                type="text"
                name="reason"
                required
                placeholder="e.g. Tightening security thresholds for Q3"
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
              Publish Version
            </button>
          </form>
        </div>

        {/* Existing Versions (Placeholder) */}
        <div>
          <h2 className="font-bold mb-4">Active Versions</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  BEHAVIOR_THRESHOLD
                </span>
                <span className="text-sm font-bold text-slate-500">
                  v3 (Active)
                </span>
              </div>
              <div className="text-sm font-bold text-slate-600 font-mono overflow-hidden text-ellipsis">
                {'{ "max_errors": 100 }'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
