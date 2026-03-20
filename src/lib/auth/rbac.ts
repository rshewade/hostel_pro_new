import { headers } from 'next/headers';
import { auth, type Session } from './index';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type UserRole = 'STUDENT' | 'SUPERINTENDENT' | 'TRUSTEE' | 'ACCOUNTS' | 'PARENT';

/**
 * Get the current session from request headers.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

/**
 * Require authentication. Throws UnauthorizedError if no session.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  return session;
}

/**
 * Require specific role(s). Throws ForbiddenError if user doesn't have the role.
 * Looks up the user's role from the app `users` table (not Better Auth's user table).
 */
export async function requireRole(
  session: Session,
  allowedRoles: UserRole[],
): Promise<{ role: UserRole; vertical: string | null }> {
  const [appUser] = await db
    .select({ role: users.role, vertical: users.vertical })
    .from(users)
    .where(eq(users.authUserId, session.user.id));

  if (!appUser) {
    throw new ForbiddenError('User profile not found');
  }

  if (!allowedRoles.includes(appUser.role as UserRole)) {
    throw new ForbiddenError(
      `Role '${appUser.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
    );
  }

  return { role: appUser.role as UserRole, vertical: appUser.vertical };
}

/**
 * Check if user is staff (SUPERINTENDENT, TRUSTEE, or ACCOUNTS).
 */
export function isStaff(role: UserRole): boolean {
  return ['SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS'].includes(role);
}

/**
 * Check if user is admin (TRUSTEE or ACCOUNTS).
 */
export function isAdmin(role: UserRole): boolean {
  return ['TRUSTEE', 'ACCOUNTS'].includes(role);
}
