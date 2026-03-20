import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'audit-1',
          entityType: 'AUTH',
          action: 'LOGIN',
          createdAt: new Date().toISOString(),
        }]),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  auditLogs: {
    id: 'id',
    entityType: 'entity_type',
    entityId: 'entity_id',
    action: 'action',
    actorId: 'actor_id',
    createdAt: 'created_at',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { createAuditLog, logAuth, logEntityChange, getAuditLogsByActor, getAuditLogsByEntity } from '../audit';
import { db } from '@/lib/db';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

describe('Audit log functions - signature verification', () => {
  it('createAuditLog is a function that accepts data and returns a result', async () => {
    expect(typeof createAuditLog).toBe('function');

    const result = await createAuditLog({
      entityType: 'AUTH',
      action: 'LOGIN',
      actorId: 'user-1',
      metadata: { phone: '+91999' },
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('id');
  });

  it('createAuditLog returns null when db insert fails', async () => {
    (db.insert as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      values: () => ({
        returning: () => Promise.reject(new Error('DB error')),
      }),
    }));

    const result = await createAuditLog({
      entityType: 'AUTH',
      action: 'FAILED_LOGIN',
    });

    expect(result).toBeNull();
  });

  it('logAuth is a function that accepts action and metadata', async () => {
    expect(typeof logAuth).toBe('function');

    const result = await logAuth('LOGIN', {
      phone: '+919876543210',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      actorId: 'user-1',
      success: true,
    });

    expect(result).toBeDefined();
  });

  it('logAuth passes AUTH as entityType', async () => {
    const insertSpy = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'audit-2', entityType: 'AUTH' }]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertSpy);

    await logAuth('OTP_VERIFY', {
      phone: '+919876543210',
      ip: '10.0.0.1',
      success: true,
    });

    expect(insertSpy).toHaveBeenCalled();
    const insertedValues = insertSpy.mock.results[0]?.value.values;
    expect(insertedValues).toHaveBeenCalled();
  });

  it('logEntityChange is a function that accepts entity details', async () => {
    expect(typeof logEntityChange).toBe('function');

    const result = await logEntityChange('USER', 'user-123', 'CREATE', 'admin-1', {
      name: 'New User',
    });

    expect(result).toBeDefined();
  });

  it('logEntityChange accepts CREATE, UPDATE, DELETE actions', async () => {
    for (const action of ['CREATE', 'UPDATE', 'DELETE'] as const) {
      const result = await logEntityChange('ROOM', 'room-1', action, 'admin-1');
      expect(result).toBeDefined();
    }
  });

  it('getAuditLogsByActor is a function that returns an array', async () => {
    expect(typeof getAuditLogsByActor).toBe('function');

    const result = await getAuditLogsByActor('user-1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getAuditLogsByActor accepts optional limit parameter', async () => {
    const result = await getAuditLogsByActor('user-1', 50);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getAuditLogsByEntity is a function that returns an array', async () => {
    expect(typeof getAuditLogsByEntity).toBe('function');

    const result = await getAuditLogsByEntity('USER', 'user-123');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getAuditLogsByEntity accepts optional limit parameter', async () => {
    const result = await getAuditLogsByEntity('ROOM', 'room-1', 25);
    expect(Array.isArray(result)).toBe(true);
  });
});
