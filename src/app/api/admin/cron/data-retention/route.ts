import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { runDataRetention } from '@/lib/services/data-retention';
import { UnauthorizedError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      throw new UnauthorizedError('Invalid cron secret');
    }

    const result = await runDataRetention();
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
