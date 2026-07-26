import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { stopTunnel } from "@/app/actions/tunnel";

export async function GET() {
  // Auto-stop tunnel on logout/session end
  try {
    await stopTunnel();
  } catch (e) {
    // Ignore error
  }

  const cookieStore = await cookies();

  // Clear all auth related cookies
  cookieStore.delete("session_token");
  cookieStore.delete("auth_token");
  cookieStore.delete("impersonation_id");

  // Redirect to login with specific error message
  redirect("/login?error=SessionExpired");
}
