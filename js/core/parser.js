import { indexLines, assertWithinLimit } from './indexer.js';
import { parseUnity } from '../adapters/unity.js';
import { parseUnreal } from '../adapters/unreal.js';
import { parseGodot } from '../adapters/godot.js';

const adapters = [parseUnity, parseUnreal, parseGodot];
const DIAGNOSTIC_HINT = /\b(?:shader|compile|compiling|variant|material|fatal|error|warning|failed|exception)\b/i;

export async function parseLog(text, { maxBytes } = {}) {
  const bytes = assertWithinLimit(text, maxBytes);
  const lines = indexLines(text);
  const findings = [];
  for (const line of lines) {
    if (!line.parseLine.trim()) continue;
    let parsed = null;
    for (const adapter of adapters) {
      parsed = adapter(line);
      if (parsed) break;
    }
    if (!parsed && DIAGNOSTIC_HINT.test(line.parseLine)) {
      parsed = { engine: 'unknown', severity: 'unknown', message: line.parseLine.trim(), shader: null, material: null, path: null, platform: null, confidence: 'low', metrics: null };
    }
    if (!parsed) continue;
    findings.push({
      engine: parsed.engine,
      severity: parsed.severity,
      message: parsed.message,
      shader: parsed.shader ?? null,
      material: parsed.material ?? null,
      path: parsed.path ?? null,
      platform: parsed.platform ?? null,
      lineNumber: line.lineNumber,
      confidence: parsed.confidence,
      rawLine: line.rawLine,
      metrics: parsed.metrics ?? null,
      sourceLine: parsed.sourceLine ?? null,
    });
  }
  return { bytes, totalLines: lines.length, findings };
}
