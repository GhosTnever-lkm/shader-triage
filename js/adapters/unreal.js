const DIAGNOSTIC = /^\s*(?:\[[^\]]+\]\s*)*LogShaderCompilers:\s*(Warning|Error|Display|Verbose):\s*(.+)$/i;
const WORKER_FAILURE = /ShaderCompileWorker.*?(?:terminated|crash|return code|failed)/i;
const MATERIAL = /(?:Material|material)\s+([^,\s]+(?:\.[^,\s]+)?)/;
const PLATFORM = /for platform\s+([A-Za-z0-9_]+)/i;
const DEBUG_PATH = /(?:[A-Za-z]:[\\/]|\/)[^\r\n]*Saved[\\/]ShaderDebugInfo[\\/][^\s"']+/i;

export function parseUnreal(line) {
  const text = line.parseLine;
  const diagnostic = DIAGNOSTIC.exec(text);
  if (diagnostic) {
    const message = diagnostic[2].trim();
    const material = MATERIAL.exec(message)?.[1] ?? null;
    const platform = PLATFORM.exec(message)?.[1] ?? null;
    const severity = diagnostic[1].toLowerCase() === 'warning' ? 'warning' : diagnostic[1].toLowerCase() === 'error' || WORKER_FAILURE.test(message) ? 'error' : 'info';
    return { engine: 'unreal', severity, message, shader: null, material, path: null, platform, confidence: 'high', metrics: null };
  }
  const path = DEBUG_PATH.exec(text)?.[0];
  if (path) return { engine: 'unreal', severity: 'info', message: 'Shader debug info path', shader: null, material: null, path, platform: null, confidence: 'medium', metrics: null };
  return null;
}
