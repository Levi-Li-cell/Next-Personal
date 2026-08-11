import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";

export async function isAdminRequest(): Promise<boolean> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return false;
    const [found] = await db.select().from(user).where(eq(user.id, session.user.id));
    return found?.role === "admin";
  } catch (error) {
    console.error("isAdminRequest error:", error);
    return false;
  }
}
