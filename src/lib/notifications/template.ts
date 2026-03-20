/**
 * Renders a template string with {{variable}} substitution.
 * e.g. "Hello {{name}}" + { name: "Alice" } → "Hello Alice"
 */
export function renderTemplate(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] ?? match;
  });
}
