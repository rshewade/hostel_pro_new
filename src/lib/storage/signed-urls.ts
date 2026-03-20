import { createHmac } from 'crypto';

const SECRET = () => process.env.SIGNED_URL_SECRET!;
const DEFAULT_EXPIRY = 3600; // 1 hour

export function generateSignedUrl(path: string, expiresInSeconds = DEFAULT_EXPIRY): {
  url: string;
  token: string;
  expiresAt: number;
} {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${path}:${expiresAt}`;
  const token = createHmac('sha256', SECRET()).update(payload).digest('hex');

  return {
    url: `/api/storage/${path}?token=${token}&expires=${expiresAt}`,
    token,
    expiresAt,
  };
}

export function verifySignedUrl(path: string, token: string, expires: string): boolean {
  const expiresAt = parseInt(expires, 10);

  // Check expiry
  if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  // Verify HMAC
  const payload = `${path}:${expiresAt}`;
  const expectedToken = createHmac('sha256', SECRET()).update(payload).digest('hex');
  return token === expectedToken;
}
