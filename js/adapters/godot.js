const GODOT_PATH_ERROR = /^\s*ERROR:\s*(?:Shader compilation failed\.?\s*)?At:\s*(res:\/\/[^\s:]+):(\d+)\s*$/i;
const GODOT_SOURCE_ERROR = /^\s*ERROR:\s*(res:\/\/[^\s:]+):(\d+)\s*[-:]\s*(.+)$/i;
const GODOT_GLSL_ERROR = /^\s*ERROR:\s*(\d+):(\d+):\s*(.+)$/i;
const SHADER_HINT = /shader|sampler|uniform|varying|render_mode|gdshader|gdshaderinc/i;
const UNKNOWN_IDENTIFIER = /Unknown identifier in expression:\s*['"]?([^'".]+)['"]?/i;

export function parseGodot(line) {
  const text = line.parseLine;
  let match = GODOT_PATH_ERROR.exec(text);
  if (match) return { engine: 'godot', severity: 'error', message: 'Shader compilation failed', shader: null, material: null, path: match[1], platform: null, sourceLine: Number(match[2]), confidence: 'high', metrics: null };
  match = GODOT_SOURCE_ERROR.exec(text);
  if (match) return { engine: 'godot', severity: 'error', message: match[3].trim(), shader: null, material: null, path: match[1], platform: null, sourceLine: Number(match[2]), confidence: 'high', metrics: null };
  match = GODOT_GLSL_ERROR.exec(text);
  if (match && SHADER_HINT.test(match[3])) return { engine: 'godot', severity: 'error', message: match[3].trim(), shader: null, material: null, path: null, platform: null, sourceLine: Number(match[2]), confidence: 'medium', metrics: null };
  if (/\bShader compilation failed\b/i.test(text) && /^\s*ERROR:/i.test(text)) {
    const identifier = UNKNOWN_IDENTIFIER.exec(text);
    return { engine: 'godot', severity: 'error', message: identifier ? `Unknown identifier: ${identifier[1].trim()}` : text.replace(/^\s*ERROR:\s*/i, '').trim(), shader: null, material: null, path: null, platform: null, confidence: identifier ? 'medium' : 'medium', metrics: null };
  }
  return null;
}
