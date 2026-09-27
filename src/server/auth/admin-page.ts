import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "./cookies";
import { authenticateAdminToken } from "./admin-session";
import { hasPermission, type Permission } from "../../domain/permissions";

export async function requireAdminPage(permission?: Permission) {
  const store = await cookies();
  const auth = await authenticateAdminToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  if (!auth) redirect("/admin/login");
  if (permission && !hasPermission(auth.user.role, permission)) notFound();
  return auth;
}
