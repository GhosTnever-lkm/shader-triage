const patterns = [
  {
    regex: /^Compiling shader\s+"([^"\r\n]+)"\s+pass\s+"([^"\r\n]*)"\s*\(([^)]+)\)/i,
    parse: (match) => ({ severity: 'info', message: `Compiling shader pass ${match[2] || '(unnamed)'} (${match[3]})`, shader: match[1], confidence: 'high' }),
  },
  {
    regex: /compiled\s+(\d+)\s+variants\s+\(([\d.]+)\s*s\s+CPU time\)/i,
    parse: (match, line) => {
      const compiled = /compiled\s+(\d+)\s+variants\s+\(([\d.]+)\s*s\s+CPU time\)/i.exec(line);
      if (!compiled) return null;
      return { severity: 'info', message: `Compiled ${compiled[1]} shader variants`, confidence: 'high', metrics: { compiledVariants: Number(compiled[1]), cpuSeconds: Number(compiled[2]), durationKind: 'cpu-time' } };
    },
  },
  {
    regex: /^STRIPPING:\s+(.+?)\s+-\s+Remaining shader variants\s*=\s*(\d+)\s*\/\s*(\d+).*?Total\s*=\s*(\d+)\s*\/\s*(\d+)/i,
    parse: (match) => ({ severity: 'info', message: `Shader variant stripping: ${match[2]}/${match[3]} remain`, shader: match[1], confidence: 'high', metrics: { remainingVariants: Number(match[2]), variantSpace: Number(match[3]), totalRemainingVariants: Number(match[4]), totalVariantSpace: Number(match[5]) } }),
  },
  {
    regex: /^Compiled shader:\s*(.+?)\s*$/i,
    parse: (match) => ({ severity: 'info', message: 'Compiled shader at runtime', shader: match[1], confidence: 'high' }),
  },
  {
    regex: /^Shader (error|warning) in\s+'([^']+)'\s*:?\s*(.*)$/i,
    parse: (match) => ({ severity: match[1].toLowerCase(), message: match[3] || `Shader ${match[1].toLowerCase()}`, shader: match[2], confidence: match[3] ? 'high' : 'medium' }),
  },
];

export function parseUnity(line) {
  for (const item of patterns) {
    const match = item.regex.exec(line.parseLine);
    if (!match) continue;
    const result = item.parse(match, line.parseLine);
    if (!result) continue;
    return { engine: 'unity', material: null, path: null, platform: null, ...result };
  }
  return null;
}
