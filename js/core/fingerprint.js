const FIELDS = ['engine', 'severity', 'message', 'shader', 'material', 'path', 'platform', 'sourceLine', 'metrics'];

export function canonicalFinding(finding) {
  return JSON.stringify(FIELDS.map((field) => {
    const value = finding[field];
    return typeof value === 'string' ? value.normalize('NFC').trim() : (value ?? null);
  }));
}

export async function fingerprintFor(canonical) {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable. Open ShaderTriage on GitHub Pages or localhost.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
