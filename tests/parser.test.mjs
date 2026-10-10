import test from 'node:test';
import assert from 'node:assert/strict';
import { indexLines, assertWithinLimit, MAX_BYTES } from '../js/core/indexer.js';
import { parseLog } from '../js/core/parser.js';
import { buildReport } from '../js/core/report.js';
import { toMarkdown } from '../js/ui/export.js';

test('indexes CRLF, LF, CR and preserves exact raw line and source line numbers', () => {
  const lines = indexLines('\uFEFFfirst\r\nsecond\nthird\rfourth');
  assert.deepEqual(lines.map(({ lineNumber, rawLine }) => [lineNumber, rawLine]), [[1, '\uFEFFfirst'], [2, 'second'], [3, 'third'], [4, 'fourth']]);
  assert.equal(lines[0].parseLine, 'first');
});

test('rejects byte sizes over 20 MiB and accepts exactly the cap', () => {
  assert.equal(assertWithinLimit('x'.repeat(16), 16), 16);
  assert.throws(() => assertWithinLimit('я'.repeat(9), 16), { code: 'FILE_TOO_LARGE' });
  assert.equal(MAX_BYTES, 20 * 1024 * 1024);
});

test('recognizes documented Unity build lines and keeps CPU time separate', async () => {
  const text = 'Compiling shader "Universal Render Pipeline/Lit" pass "ForwardLit" (fp)\nfinished in 29.72 seconds. Local cache hits 202 (0.24s CPU time), remote cache hits 0 (0.00s), compiled 118 variants (582.41s CPU time), skipped 0 variants\nSTRIPPING: Universal Render Pipeline/Lit (ForwardLit pass) (Fragment) - Remaining shader variants = 640/5760 = 11.11% - Total = 2657/10169 = 26.12%\nCompiled shader: Hidden/InternalClear';
  const report = await buildReport(await parseLog(text));
  assert.equal(report.findings[0].engine, 'unity');
  assert.equal(report.findings[0].shader, 'Universal Render Pipeline/Lit');
  assert.equal(report.compiledVariants, 118);
  assert.equal(report.shaderJobCpuSeconds, 582.41);
  assert.ok(!toMarkdown(report).includes('total build duration: 582'));
  assert.equal(report.findings.at(-1).shader, 'Hidden/InternalClear');
});

test('recognizes Unreal ShaderCompileWorker warning with material and platform', async () => {
  const text = '[2026.01.26-14.56.46:647][887]LogShaderCompilers: Warning: Failed to compile Material /Engine/BufferVisualization/AmbientOcclusion.AmbientOcclusion for platform PCD3D_SM6, Default Material will be used in game.';
  const { findings } = await parseLog(text);
  assert.equal(findings[0].engine, 'unreal');
  assert.equal(findings[0].severity, 'warning');
  assert.equal(findings[0].material, '/Engine/BufferVisualization/AmbientOcclusion.AmbientOcclusion');
  assert.equal(findings[0].platform, 'PCD3D_SM6');
});

test('recognizes Unreal worker errors without inventing material or platform', async () => {
  const { findings } = await parseLog('LogShaderCompilers: Error: ShaderCompileWorker terminated unexpectedly, return code -1073741819!');
  assert.equal(findings[0].engine, 'unreal');
  assert.equal(findings[0].severity, 'error');
  assert.equal(findings[0].material, null);
  assert.equal(findings[0].platform, null);
});

test('recognizes Unreal debug info paths as informational evidence', async () => {
  const { findings } = await parseLog('D:/Project/Saved/ShaderDebugInfo/PCD3D_SM6/M_Sparks/Default/Vertex/0_123456');
  assert.equal(findings[0].engine, 'unreal');
  assert.equal(findings[0].severity, 'info');
  assert.match(findings[0].path, /Saved\/ShaderDebugInfo/);
});

test('recognizes Godot shader compile errors with resource path and source location', async () => {
  const { findings } = await parseLog('ERROR: Shader compilation failed. At: res://shaders/dissolve.gdshader:14');
  assert.equal(findings[0].engine, 'godot');
  assert.equal(findings[0].path, 'res://shaders/dissolve.gdshader');
  assert.equal(findings[0].sourceLine, 14);
});

test('recognizes Godot compiler messages only when a shader-specific marker is present', async () => {
  const { findings } = await parseLog("ERROR: 0:1409: '[' : array index for samplers must be constant integral expressions");
  assert.equal(findings[0].engine, 'godot');
  assert.equal(findings[0].sourceLine, 1409);
  assert.equal(findings[0].confidence, 'medium');
  assert.equal((await parseLog('ERROR: 0:1409: unexpected token')).findings[0].engine, 'unknown');
});

test('groups identical diagnostics across line numbers but preserves raw source occurrences', async () => {
  const text = 'LogShaderCompilers: Warning: Failed to compile shader\nLogShaderCompilers: Warning: Failed to compile shader';
  const report = await buildReport(await parseLog(text));
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].count, 2);
  assert.equal(report.findings[0].firstSeen, 1);
  assert.equal(report.findings[0].lastSeen, 2);
  assert.equal(report.findings[0].rawLine, text.split('\n')[0]);
});

test('keeps unrelated engine output out of findings and diagnostic-like misses visible as unknown', async () => {
  const result = await parseLog('LogTemp: Display: Hello\nShader compiler printed an unfamiliar detail');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].engine, 'unknown');
  assert.equal(result.findings[0].severity, 'unknown');
});

test('handles BOM, CRLF, non-ASCII message, malformed and mixed engine lines', async () => {
  const text = '\uFEFFCompiling shader "水/Вода" pass "Forward" (fp)\r\nERROR: Shader compilation failed. At: res://水/вода.gdshader:5\r\nCompiling shader "\r\nLogShaderCompilers: Error: Failed to compile Material /Game/M.Grass for platform PCD3D_SM6';
  const result = await parseLog(text);
  assert.deepEqual(result.findings.map((item) => item.engine), ['unity', 'godot', 'unknown', 'unreal']);
  assert.equal(result.findings[0].rawLine, '\uFEFFCompiling shader "水/Вода" pass "Forward" (fp)');
  assert.equal(result.findings[1].path, 'res://水/вода.gdshader');
});

test('fingerprint grouping ignores line numbers but differs by shader identity', async () => {
  const text = 'Shader error in \'Custom/Water\': bad token\nShader error in \'Custom/Water\': bad token\nShader error in \'Custom/Glass\': bad token';
  const { findings } = await buildReport(await parseLog(text));
  assert.equal(findings.length, 2);
  assert.equal(findings[0].count, 2);
  assert.notEqual(findings[0].fingerprint, findings[1].fingerprint);
});

test('Markdown escapes pipes and labels CPU time accurately', () => {
  const text = toMarkdown({ totalLines: 1, occurrences: 1, groups: 1, occurrenceCounts: { error: 0, warning: 0, info: 1, unknown: 0 }, compiledVariants: 1, shaderJobCpuSeconds: 0.4, findings: [{ severity: 'info', engine: 'unity', message: 'foo | bar', shader: 'test', material: null, path: null, platform: null, firstSeen: 1, count: 1, confidence: 'high' }] });
  assert.match(text, /foo \\\| bar/);
  assert.match(text, /CPU time, not wall-clock build duration/);
});
