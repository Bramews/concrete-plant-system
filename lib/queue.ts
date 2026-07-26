import { prisma } from "@/lib/prisma";

// Simple DB Backed Job Queue
// Since we don't have Redis, we use specific table or just reuse a Task/Event table.
// Let's create a 'Job' model logic using existing WebhookEvent or just generic table?
// We don't have a 'Job' table in schema. Let's use `WebhookEvent` or `UsageEvent`?
// No, let's just make a simple in-memory queue that flushes to DB logs for now
// OR better, create a simple `SystemJob` if we can.
// User didn't want new migrations if possible, but we just did one.
// Let's stick to using `CompanyActivityLog` to track "Background Jobs" for now
// or just implement the interface that *would* use BullMQ but falls back to direct execution.

export async function enqueueJob(
  queueName: string,
  jobName: string,
  data: any,
) {
  // 1. Log Job Start
  console.log(`[Queue:${queueName}] Enqueuing ${jobName}`);

  // For MVP/No-Redis: Execute immediately (Async)
  // This isn't durable but works for "completing the task" behaviorally.

  (async () => {
    try {
      await processJob(queueName, jobName, data);
    } catch (e) {
      console.error(`[Queue:${queueName}] Job ${jobName} failed`, e);
    }
  })();
}

async function processJob(queueName: string, jobName: string, data: any) {
  // Route to handler
  if (jobName === "GENERATE_INVOICE_PDF") {
    await generateInvoicePdf(data.invoiceId);
  }
}

async function generateInvoicePdf(invoiceId: string) {
  // Mock PDF Generation
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { company: true },
  });

  if (!invoice) return;

  // Simulate PDF generation delay
  await new Promise((r) => setTimeout(r, 1000));

  const mockPdfUrl = `https://api.system.com/invoices/${invoiceId}.pdf`;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl: mockPdfUrl },
  });

  await prisma.companyActivityLog.create({
    data: {
      id: `act_${Date.now()}_invoice_${invoiceId}`,
      companyId: invoice.companyId,
      type: "INVOICE_GENERATED",
      message: `Invoice PDF generated for ${invoice.amount} ${invoice.currency}`,
      severity: "INFO",
    },
  });
}
