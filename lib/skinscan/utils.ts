// lib/skinscan/utils.ts
/**
 * Utility functions safe for client-side imports.
 */
export function getSteamCdnUrl(iconUrl: string): string {
  if (!iconUrl) return 'https://community.akamai.steamstatic.com/economy/image/placeholder';
  const clean = iconUrl.replace('https://community.akamai.steamstatic.com/economy/image/', '');
  return `https://community.akamai.steamstatic.com/economy/image/${clean}/330x192`;
}
