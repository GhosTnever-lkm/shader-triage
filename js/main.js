import { parseLog } from './core/parser.js';
import { buildReport } from './core/report.js';
import { MAX_BYTES, assertWithinLimit, bytesIn, formatMiB } from './core/indexer.js';
import { downloadText, toMarkdown } from './ui/export.js';
import { filterFindings, renderFindings, renderSummary } from './ui/render.js';
import { demoLog } from './demo-log.js';

const input = document.querySelector('#log-input');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const fileInput = document.querySelector('#file-input');
const dropzone = document.querySelector('#dropzone');
const summary = document.querySelector('#summary');
const body = document.querySelector('#findings-body');
const byteCount = document.querySelector('#byte-count');
const matchCount = document.querySelector('#match-count');
const emptyResults = document.querySelector('#empty-results');
const reportSource = document.querySelector('#report-source');
let report = null;
let sourceName = 'pasted-log';

function setStatus(message, kind = 'neutral') {
  status.textContent = message;
  status.className = `status status-${kind}`;
}

function updateByteCount() {
  const bytes = bytesIn(input.value);
  byteCount.textContent = `${formatMiB(bytes)} / 20 MiB`;
  byteCount.classList.toggle('over-limit', bytes > MAX_BYTES);
}

function refreshFindings() {
  if (!report) return;
  const visible = filterFindings(report.findings, {
    query: document.querySelector('#search-input').value,
    engine: document.querySelector('#engine-filter').value,
    severity: document.querySelector('#severity-filter').value,
  });
  renderFindings(body, visible);
  matchCount.textContent = `${visible.length} / ${report.findings.length} groups`;
  emptyResults.hidden = visible.length !== 0;
}

async function analyze(text = input.value, name = sourceName) {
  try {
    assertWithinLimit(text);
    setStatus('Analyzing locally…');
    const parsed = await parseLog(text);
    report = await buildReport(parsed);
    sourceName = name;
    renderSummary(summary, report);
    reportSource.textContent = `${sourceName} · ${formatMiB(report.bytes)} MiB · ${report.totalLines} lines`;
    results.hidden = false;
    refreshFindings();
    setStatus(`${report.occurrences} diagnostic lines grouped into ${report.groups} findings.`, 'success');
  } catch (error) {
    report = null;
    results.hidden = true;
    setStatus(error.message || 'The log could not be analyzed.', 'error');
  }
}

input.addEventListener('input', updateByteCount);
document.querySelector('#analyze-button').addEventListener('click', () => analyze());
document.querySelector('#demo-button').addEventListener('click', () => {
  input.value = demoLog;
  sourceName = 'built-in-sample.log';
  updateByteCount();
  analyze(demoLog, sourceName);
});
for (const selector of ['#search-input', '#engine-filter', '#severity-filter']) {
  document.querySelector(selector).addEventListener('input', refreshFindings);
  document.querySelector(selector).addEventListener('change', refreshFindings);
}
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > MAX_BYTES) {
    setStatus(`This file is ${formatMiB(file.size)} MiB; the limit is 20 MiB. Choose a smaller log.`, 'error');
    fileInput.value = '';
    return;
  }
  try {
    input.value = await file.text();
    sourceName = file.name;
    updateByteCount();
    setStatus('Log loaded locally. Select Analyze log to review it.', 'success');
  } catch {
    setStatus('The selected file could not be read as text.', 'error');
  }
});
for (const eventName of ['dragenter', 'dragover']) dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dropzone-active'); });
for (const eventName of ['dragleave', 'drop']) dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dropzone-active'); });
dropzone.addEventListener('drop', async (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (file.size > MAX_BYTES) { setStatus(`This file is ${formatMiB(file.size)} MiB; the limit is 20 MiB. Choose a smaller log.`, 'error'); return; }
  try {
    input.value = await file.text();
    sourceName = file.name;
    updateByteCount();
    setStatus('Log loaded locally. Select Analyze log to review it.', 'success');
  } catch {
    setStatus('The dropped file could not be read as text.', 'error');
  }
});
document.querySelector('#export-json').addEventListener('click', () => {
  if (report) downloadText('shadertriage-report.json', `${JSON.stringify(report, null, 2)}\n`, 'application/json');
});
document.querySelector('#export-md').addEventListener('click', () => {
  if (report) downloadText('shadertriage-report.md', toMarkdown(report), 'text/markdown;charset=utf-8');
});
updateByteCount();
