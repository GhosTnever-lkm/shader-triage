import { canonicalFinding, fingerprintFor } from './fingerprint.js';

export async function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    const key = canonicalFinding(finding);
    let group = groups.get(key);
    if (!group) {
      group = { ...finding, firstSeen: finding.lineNumber, lastSeen: finding.lineNumber, count: 0 };
      groups.set(key, group);
    }
    group.count += 1;
    group.lastSeen = finding.lineNumber;
  }
  const output = [];
  for (const [key, group] of groups) {
    group.fingerprint = await fingerprintFor(key);
    output.push(group);
  }
  return output.sort((a, b) => a.firstSeen - b.firstSeen);
}
