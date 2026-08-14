import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: apiError("Authentication required.", 401) };
  }
  return { user, response: null };
}
