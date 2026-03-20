import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { getSmsProvider } from '@/lib/auth/otp-provider';
import { z } from 'zod';

const resendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(req: NextRequest) {
  try {
    const body = resendOtpSchema.parse(await req.json());
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const provider = getSmsProvider();
    await provider.sendOtp(body.phone, code);

    return NextResponse.json({
      success: true,
      expiresIn: 600,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
