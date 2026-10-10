import { groupFindings } from './grouper.js';

export async function buildReport(parsed) {
  const grouped = await groupFindings(parsed.findings);
  const occurrenceCounts = { error: 0, warning: 0, info: 0, unknown: 0 };
  const engineOccurrences = { unity: 0, unreal: 0, godot: 0, unknown: 0 };
  let compiledVariants = 0;
  let cpuSeconds = 0;
  let variantMetricsSeen = false;
  for (const item of parsed.findings) {
    occurrenceCounts[item.severity] = (occurrenceCounts[item.severity] ?? 0) + 1;
    engineOccurrences[item.engine] = (engineOccurrences[item.engine] ?? 0) + 1;
    if (item.metrics?.compiledVariants != null) {
      variantMetricsSeen = true;
      compiledVariants += item.metrics.compiledVariants;
      cpuSeconds += item.metrics.cpuSeconds ?? 0;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    totalLines: parsed.totalLines,
    bytes: parsed.bytes,
    occurrences: parsed.findings.length,
    groups: grouped.length,
    occurrenceCounts,
    engineOccurrences,
    compiledVariants: variantMetricsSeen ? compiledVariants : null,
    shaderJobCpuSeconds: variantMetricsSeen ? cpuSeconds : null,
    findings: grouped,
  };
}
