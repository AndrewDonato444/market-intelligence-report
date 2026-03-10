/**
 * Strip markdown code fences from an LLM response before JSON.parse.
 *
 * Handles:
 *   - Complete fences: ```json\n{...}\n```
 *   - Truncated fences: ```json\n{...  (no closing ```, common when max_tokens hit)
 *   - Bare JSON (no fences)
 */
export function stripJsonFences(text: string): string {
  const trimmed = text.trim();

  // Try complete fence first
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Handle truncated fence (opening ``` but no closing — max_tokens truncation)
  const openFenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*)$/);
  if (openFenceMatch) return openFenceMatch[1].trim();

  return trimmed;
}
