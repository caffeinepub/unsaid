const STORAGE_KEY = "wb_device_id";

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Force 32-bit integer
  }
  // Convert to unsigned hex
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(screen.colorDepth),
    String(navigator.hardwareConcurrency ?? ""),
  ];
  const raw = components.join("|");

  // Multi-round hash for better distribution
  const h1 = djb2Hash(raw);
  const h2 = djb2Hash(raw.split("").reverse().join(""));
  const h3 = djb2Hash(h1 + h2);
  return h1 + h2 + h3;
}

export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = generateFingerprint();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Fallback if localStorage is unavailable
    return generateFingerprint();
  }
}

/**
 * Computes a stable 4-digit anonymous ID for a given device+post combination.
 * Each unique device gets a different number on the same post.
 */
export function computeAnonymousId(deviceId: string, postId: bigint): number {
  const combined = deviceId + String(postId);
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) + hash + combined.charCodeAt(i);
    hash = hash & hash;
  }
  return ((hash >>> 0) % 9000) + 1000;
}
