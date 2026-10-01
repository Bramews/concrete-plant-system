import { getCurrentUser } from "../lib/auth";
import { getUserPreferences } from "../app/actions/preferences";
import {
  getCommandCenterData,
  getAllTenants,
  getSystemLogs,
  getSystemDomains,
  getRecentAlerts,
  getTopUsage,
  getOutstandingPayments,
  getCompaniesInGrace,
  getPlanSuggestions,
} from "../app/actions/admin-sovereignty";
import { prisma } from "../lib/prisma";

async function testAdminFunctions() {
  console.log("--- Testing Admin Page Functions ---");

  let t = Date.now();
  console.log("1. Testing prisma connect...");
  await prisma.$connect();
  console.log(`Prisma connected in ${Date.now() - t}ms`);

  t = Date.now();
  console.log("2. Testing getCommandCenterData...");
  try {
    const cc = await getCommandCenterData();
    console.log(
      `getCommandCenterData in ${Date.now() - t}ms:`,
      Object.keys(cc),
    );
  } catch (e) {
    console.error(
      `getCommandCenterData error in ${Date.now() - t}ms:`,
      e.message,
    );
  }

  t = Date.now();
  console.log("3. Testing getAllTenants...");
  try {
    const tenants = await getAllTenants();
    console.log(
      `getAllTenants in ${Date.now() - t}ms: count =`,
      tenants.length,
    );
  } catch (e) {
    console.error(`getAllTenants error in ${Date.now() - t}ms:`, e.message);
  }

  t = Date.now();
  console.log("4. Testing getSystemLogs...");
  try {
    const logs = await getSystemLogs();
    console.log(`getSystemLogs in ${Date.now() - t}ms: count =`, logs.length);
  } catch (e) {
    console.error(`getSystemLogs error in ${Date.now() - t}ms:`, e.message);
  }

  t = Date.now();
  console.log("5. Testing getRecentAlerts...");
  try {
    const alerts = await getRecentAlerts();
    console.log(
      `getRecentAlerts in ${Date.now() - t}ms: count =`,
      alerts.length,
    );
  } catch (e) {
    console.error(`getRecentAlerts error in ${Date.now() - t}ms:`, e.message);
  }

  t = Date.now();
  console.log("6. Testing getTopUsage...");
  try {
    const usage = await getTopUsage();
    console.log(`getTopUsage in ${Date.now() - t}ms: count =`, usage.length);
  } catch (e) {
    console.error(`getTopUsage error in ${Date.now() - t}ms:`, e.message);
  }

  t = Date.now();
  console.log("7. Testing getOutstandingPayments...");
  try {
    const payments = await getOutstandingPayments();
    console.log(
      `getOutstandingPayments in ${Date.now() - t}ms: count =`,
      payments.length,
    );
  } catch (e) {
    console.error(
      `getOutstandingPayments error in ${Date.now() - t}ms:`,
      e.message,
    );
  }

  t = Date.now();
  console.log("8. Testing getCompaniesInGrace...");
  try {
    const grace = await getCompaniesInGrace();
    console.log(
      `getCompaniesInGrace in ${Date.now() - t}ms: count =`,
      grace.length,
    );
  } catch (e) {
    console.error(
      `getCompaniesInGrace error in ${Date.now() - t}ms:`,
      e.message,
    );
  }

  t = Date.now();
  console.log("9. Testing getPlanSuggestions...");
  try {
    const sug = await getPlanSuggestions();
    console.log(
      `getPlanSuggestions in ${Date.now() - t}ms: count =`,
      sug.length,
    );
  } catch (e) {
    console.error(
      `getPlanSuggestions error in ${Date.now() - t}ms:`,
      e.message,
    );
  }

  await prisma.$disconnect();
  console.log("--- All tests finished! ---");
}

testAdminFunctions();
