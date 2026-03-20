import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export async function getUserByAuthId(authUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.authUserId, authUserId));
  return user ?? null;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function createUserProfile(data: {
  authUserId: string;
  fullName: string;
  mobile: string;
  role?: string;
  vertical?: string;
  email?: string;
  parentMobile?: string;
}) {
  const [user] = await db.insert(users).values({
    authUserId: data.authUserId,
    fullName: data.fullName,
    mobile: data.mobile,
    role: (data.role as typeof users.$inferInsert.role) ?? 'STUDENT',
    vertical: data.vertical as typeof users.$inferInsert.vertical,
    email: data.email,
    parentMobile: data.parentMobile,
  }).returning();
  return user;
}

export async function updateUserProfile(authUserId: string, updates: Partial<typeof users.$inferInsert>) {
  const [user] = await db.update(users)
    .set(updates)
    .where(eq(users.authUserId, authUserId))
    .returning();
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function userExists(authUserId: string): Promise<boolean> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.authUserId, authUserId));
  return !!user;
}

export function extractUserRole(metadata: Record<string, unknown>): string {
  const validRoles = ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT'];
  const role = (metadata?.role as string)?.toUpperCase();
  return validRoles.includes(role) ? role : 'STUDENT';
}

export function extractUserVertical(metadata: Record<string, unknown>): string | undefined {
  const validVerticals = ['BOYS', 'GIRLS', 'DHARAMSHALA', 'BOYS_HOSTEL', 'GIRLS_ASHRAM'];
  const vertical = (metadata?.vertical as string)?.toUpperCase();
  return validVerticals.includes(vertical) ? vertical : undefined;
}
