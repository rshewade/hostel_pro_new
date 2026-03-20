import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    details?: { field: string; message: string }[];
  };
}

export function handleApiError(err: unknown): NextResponse<ErrorResponse> {
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', status: 400, details } },
      { status: 400 },
    );
  }

  if (err instanceof ValidationError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, status: err.status, details: err.details } },
      { status: err.status },
    );
  }

  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, status: err.status } },
      { status: err.status },
    );
  }

  logger.error('Unhandled error', err);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', status: 500 } },
    { status: 500 },
  );
}
