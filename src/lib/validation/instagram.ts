import type { InstagramAnswer } from "@/forms/answers";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function normalizeInstagram(raw: string): InstagramAnswer | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  let username = urlMatch ? urlMatch[1] : trimmed;

  if (username.startsWith("@")) {
    username = username.slice(1);
  }

  username = username.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return null;
  }

  return {
    raw: trimmed,
    username,
    url: `https://instagram.com/${username}`,
  };
}
