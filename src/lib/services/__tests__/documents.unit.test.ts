import { describe, it, expect } from 'vitest';
import { validateFile, generateStoragePath } from '../documents';

describe('DocumentsService (unit)', () => {
  describe('validateFile', () => {
    it('accepts valid PDF', () => {
      expect(() => validateFile({ size: 1024, type: 'application/pdf' })).not.toThrow();
    });

    it('accepts valid JPEG', () => {
      expect(() => validateFile({ size: 1024, type: 'image/jpeg' })).not.toThrow();
    });

    it('accepts valid PNG', () => {
      expect(() => validateFile({ size: 1024, type: 'image/png' })).not.toThrow();
    });

    it('rejects invalid MIME type', () => {
      expect(() => validateFile({ size: 1024, type: 'text/html' })).toThrow('not allowed');
    });

    it('rejects file exceeding size limit', () => {
      expect(() => validateFile({ size: 11 * 1024 * 1024, type: 'application/pdf' })).toThrow('size exceeds');
    });

    it('accepts file at exactly the size limit', () => {
      expect(() => validateFile({ size: 10 * 1024 * 1024, type: 'application/pdf' })).not.toThrow();
    });
  });

  describe('generateStoragePath', () => {
    it('generates path with user and application', () => {
      const path = generateStoragePath('user-123', 'app-456', 'document.pdf');
      expect(path).toMatch(/^user-123\/app-456\/\d+_document\.pdf$/);
    });

    it('generates path without application', () => {
      const path = generateStoragePath('user-123', null, 'photo.jpg');
      expect(path).toMatch(/^user-123\/general\/\d+_photo\.jpg$/);
    });

    it('sanitizes filename', () => {
      const path = generateStoragePath('user-1', 'app-1', 'my file (1).pdf');
      expect(path).toContain('my_file__1_.pdf');
    });
  });
});
