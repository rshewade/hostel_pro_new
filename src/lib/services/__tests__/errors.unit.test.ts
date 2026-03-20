import { describe, it, expect } from 'vitest';
import {
  AppError, NotFoundError, ForbiddenError, UnauthorizedError,
  ValidationError, ConflictError, RateLimitError,
} from '@/lib/errors';

describe('Error Classes', () => {
  it('AppError has correct properties', () => {
    const err = new AppError('test', 418, 'TEAPOT');
    expect(err.message).toBe('test');
    expect(err.status).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err).toBeInstanceOf(Error);
  });

  it('NotFoundError defaults', () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
  });

  it('NotFoundError custom message', () => {
    const err = new NotFoundError('User not found');
    expect(err.message).toBe('User not found');
    expect(err.status).toBe(404);
  });

  it('ForbiddenError', () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('UnauthorizedError', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ValidationError with details', () => {
    const err = new ValidationError('Bad input', [
      { field: 'email', message: 'Invalid email' },
    ]);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toHaveLength(1);
    expect(err.details![0].field).toBe('email');
  });

  it('ConflictError', () => {
    const err = new ConflictError();
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('RateLimitError', () => {
    const err = new RateLimitError();
    expect(err.status).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });

  it('all errors are instanceof AppError', () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
    expect(new ForbiddenError()).toBeInstanceOf(AppError);
    expect(new UnauthorizedError()).toBeInstanceOf(AppError);
    expect(new ValidationError()).toBeInstanceOf(AppError);
    expect(new ConflictError()).toBeInstanceOf(AppError);
    expect(new RateLimitError()).toBeInstanceOf(AppError);
  });
});
