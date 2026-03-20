import { mkdir, unlink, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { logger } from '@/lib/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

function resolvePath(relativePath: string): string {
  const resolved = join(UPLOAD_DIR, relativePath);
  // Prevent path traversal
  if (!resolved.startsWith(UPLOAD_DIR)) {
    throw new Error('Invalid storage path: path traversal detected');
  }
  return resolved;
}

export async function upload(relativePath: string, data: Buffer | Uint8Array): Promise<void> {
  const fullPath = resolvePath(relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await Bun.write(fullPath, data);
  logger.info(`[STORAGE] Uploaded: ${relativePath}`);
}

export async function download(relativePath: string): Promise<Uint8Array> {
  const fullPath = resolvePath(relativePath);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return new Uint8Array(await file.arrayBuffer());
}

export async function remove(relativePath: string): Promise<void> {
  const fullPath = resolvePath(relativePath);
  try {
    await unlink(fullPath);
    logger.info(`[STORAGE] Deleted: ${relativePath}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    logger.warn(`[STORAGE] File not found for deletion: ${relativePath}`);
  }
}

export async function list(directory: string): Promise<string[]> {
  const fullPath = resolvePath(directory);
  try {
    return await readdir(fullPath);
  } catch {
    return [];
  }
}

export async function exists(relativePath: string): Promise<boolean> {
  const fullPath = resolvePath(relativePath);
  try {
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}
