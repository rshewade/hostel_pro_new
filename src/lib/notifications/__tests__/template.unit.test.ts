import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../template';

describe('Template Renderer', () => {
  it('replaces variables', () => {
    const result = renderTemplate('Hello {{name}}', { name: 'Alice' });
    expect(result).toBe('Hello Alice');
  });

  it('replaces multiple variables', () => {
    const result = renderTemplate(
      '{{student_name}} leave from {{start_date}} to {{end_date}}',
      { student_name: 'Rahul', start_date: '2026-03-25', end_date: '2026-03-28' },
    );
    expect(result).toBe('Rahul leave from 2026-03-25 to 2026-03-28');
  });

  it('leaves unknown variables intact', () => {
    const result = renderTemplate('Hello {{name}}, your ID is {{id}}', { name: 'Alice' });
    expect(result).toBe('Hello Alice, your ID is {{id}}');
  });

  it('handles empty context', () => {
    const result = renderTemplate('No variables here', {});
    expect(result).toBe('No variables here');
  });

  it('handles empty template', () => {
    expect(renderTemplate('', { name: 'Alice' })).toBe('');
  });

  it('handles special characters in values', () => {
    const result = renderTemplate('Amount: {{amount}}', { amount: '₹5,000' });
    expect(result).toBe('Amount: ₹5,000');
  });
});
