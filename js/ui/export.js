const escapeCell = (value) => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');

export function toMarkdown(report) {
  const lines = [
    '# ShaderTriage report', '',
    `- Log lines: ${report.totalLines}`,
    `- Recognized / reviewable occurrences: ${report.occurrences}`,
    `- Grouped diagnostics: ${report.groups}`,
    `- Errors: ${report.occurrenceCounts.error}; warnings: ${report.occurrenceCounts.warning}; info: ${report.occurrenceCounts.info}; unknown: ${report.occurrenceCounts.unknown}`,
    report.compiledVariants == null ? '- Compiled variants: not recognized' : `- Compiled variants: ${report.compiledVariants}`,
    report.shaderJobCpuSeconds == null ? '- Shader job CPU time: not recognized' : `- Shader job CPU time: ${report.shaderJobCpuSeconds.toFixed(2)} s (CPU time, not wall-clock build duration)`,
    '', '| Level | Engine | Message | Shader / material | Platform | Log line | Count | Confidence |', '|---|---|---|---|---|---:|---:|---|',
  ];
  for (const item of report.findings) {
    lines.push(`| ${escapeCell(item.severity)} | ${escapeCell(item.engine)} | ${escapeCell(item.message)} | ${escapeCell(item.shader ?? item.material ?? item.path)} | ${escapeCell(item.platform)} | ${item.firstSeen} | ${item.count} | ${item.confidence} |`);
  }
  lines.push('', '> Heuristic report. Unknown lines are not interpreted. Review the original log; grouped messages do not prove a common root cause.', '');
  return lines.join('\n');
}

export function downloadText(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
