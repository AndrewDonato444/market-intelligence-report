/**
 * Strip markdown code fences from an LLM response before JSON.parse.
 *
 * Handles: ```json\n{...}\n```, ```\n{...}\n```, and bare JSON.
 */
export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}
