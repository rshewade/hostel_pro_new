import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { notificationRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const createRuleSchema = z.object({
  eventType: z.string().min(1),
  timing: z.string().default('IMMEDIATE'),
  channels: z.object({
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
  verticals: z.array(z.string()).optional(),
  template: z.string().min(1),
  isActive: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string().uuid(),
});

export async function GET() {
  try {
    const data = await db.select().from(notificationRules).orderBy(notificationRules.eventType);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createRuleSchema.parse(await req.json());

    const [rule] = await db.insert(notificationRules).values(body).returning();
    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = updateRuleSchema.parse(await req.json());
    const { id, ...updates } = body;

    const [rule] = await db.update(notificationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationRules.id, id))
      .returning();
    if (!rule) throw new NotFoundError('Notification rule not found');
    return NextResponse.json(rule);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) {
      const { ValidationError } = await import('@/lib/errors');
      throw new ValidationError('Missing id parameter');
    }

    const [rule] = await db.delete(notificationRules)
      .where(eq(notificationRules.id, id))
      .returning();
    if (!rule) throw new NotFoundError('Notification rule not found');
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
