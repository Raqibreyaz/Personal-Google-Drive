import DOMPurify from "dompurify";

/**
 * Strips all HTML tags and attributes from a string,
 * returning only plain text content.
 */
export function sanitizeText(value) {
  if (typeof value !== "string") return value;
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
