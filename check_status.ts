import { prisma } from "./lib/prisma";

async function checkStatus() {
  const status = await prisma.systemSetting.findUnique({
    where: { key: "AI_AGENT_STATUS" },
  });
  console.log("AI_AGENT_STATUS:", status?.value || "PASSIVE (Default)");
}

checkStatus();
