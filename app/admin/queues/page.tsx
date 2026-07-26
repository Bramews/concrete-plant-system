import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QueuesPage() {
  // Fetch REAL data from DB
  const webhookCount = await prisma.webhookEvent.count({
    where: { status: "PENDING" },
  });

  const totalWebhooks = await prisma.webhookEvent.count();

  // We treat recent Activity Logs as "Internal Jobs" history for now
  // since we run them inline (async).
  const internalJobsCount = await prisma.companyActivityLog.count();

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-screen text-slate-200">
      <h1 className="text-3xl font-black text-white tracking-tight">
        System Processing Queues
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Webhook Queue */}
        <div className="p-6 rounded-xl border border-white/5 bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-400">Webhook Events</h3>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black text-white">
              {webhookCount}
            </span>
            <span className="text-sm text-slate-500 mb-1">pending</span>
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-400">
            {totalWebhooks} processed total
          </div>
        </div>

        {/* Internal Activity Stream */}
        <div className="p-6 rounded-xl border border-white/5 bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-400">Activity Stream</h3>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black text-white">
              {internalJobsCount}
            </span>
            <span className="text-sm text-slate-500 mb-1">events</span>
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-400">
            Live ingestion
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-slate-900/50 p-8">
        <h3 className="text-lg font-bold text-white mb-4">Processing Status</h3>
        <p className="text-slate-400 text-sm">
          The system is currently running in <strong>Serverless Mode</strong>.
          Background jobs such as PDF generation and email notifications are
          processed asynchronously via the Event Loop.
          <br />
          <br />
          Webhook events from Stripe are captured in the{" "}
          <code>WebhookEvent</code> table and processed immediately.
        </p>
      </div>
    </div>
  );
}
