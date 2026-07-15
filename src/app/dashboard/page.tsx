import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DASHBOARD_HOME, type Role } from "@/lib/constants";

// Role-aware landing: /dashboard sends each role to its home page.
export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(DASHBOARD_HOME[user.role as Role] ?? "/dashboard/browse");
}
