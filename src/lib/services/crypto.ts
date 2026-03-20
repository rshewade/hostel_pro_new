import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not configured');
  return Buffer.from(key, 'hex');
}

export function isConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  if (!encrypted.includes(':')) return encrypted; // plaintext passthrough

  const [ivB64, authTagB64, ciphertext] = encrypted.split(':');
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encryptFields<T extends Record<string, unknown>>(data: T, fields: (keyof T)[]): T {
  const result = { ...data };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      (result[field] as unknown) = encrypt(result[field] as string);
    }
  }
  return result;
}

export function decryptFields<T extends Record<string, unknown>>(data: T, fields: (keyof T)[]): T {
  const result = { ...data };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      (result[field] as unknown) = decrypt(result[field] as string);
    }
  }
  return result;
}

export function hash(value: string): string {
  const salt = process.env.HASH_SALT ?? '';
  return createHmac('sha256', salt).update(value).digest('hex');
}

export function generateKey(): string {
  return randomBytes(32).toString('hex');
}
