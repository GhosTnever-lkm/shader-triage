const label = (value) => ({ unity: 'Unity', unreal: 'Unreal', godot: 'Godot', unknown: 'Unknown', error: 'Error', warning: 'Warning', info: 'Info' })[value] ?? value;
const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function renderSummary(root, report) {
  root.replaceChildren();
  const cards = [
    ['Occurrences', report.occurrences, `${report.groups} distinct groups`],
    ['Errors', report.occurrenceCounts.error, `${report.occurrenceCounts.warning} warnings`],
    ['Compiled variants', report.compiledVariants ?? '—', report.compiledVariants == null ? 'not recognized' : 'from parsed Unity log lines'],
    ['Shader job CPU time', report.shaderJobCpuSeconds == null ? '—' : `${report.shaderJobCpuSeconds.toFixed(2)} s`, report.shaderJobCpuSeconds == null ? 'not recognized' : 'not total build duration'],
  ];
  for (const [title, value, note] of cards) {
    const card = make('article', 'summary-card');
    card.append(make('span', 'summary-label', title), make('strong', 'summary-value', String(value)), make('span', 'summary-note', note));
    root.append(card);
  }
  const engines = Object.entries(report.engineOccurrences).filter(([, count]) => count).map(([engine, count]) => `${label(engine)} ${count}`).join(' · ') || 'No matching engine lines';
  const card = make('article', 'summary-card summary-engine');
  card.append(make('span', 'summary-label', 'Detected engine lines'), make('strong', 'summary-engine-list', engines), make('span', 'summary-note', `${report.totalLines} total log lines`));
  root.append(card);
}

export function filterFindings(findings, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return findings.filter((item) => (filters.engine === 'all' || item.engine === filters.engine)
    && (filters.severity === 'all' || item.severity === filters.severity)
    && (!query || [item.message, item.shader, item.material, item.path, item.platform, item.rawLine].some((value) => String(value ?? '').toLocaleLowerCase().includes(query))));
}

export function renderFindings(tbody, findings) {
  tbody.replaceChildren();
  for (const item of findings) {
    const row = document.createElement('tr');
    const level = make('span', `level level-${item.severity}`, label(item.severity));
    const cells = [level, make('span', `engine engine-${item.engine}`, label(item.engine)), item.message, item.shader ?? item.material ?? item.path ?? '—', item.firstSeen === item.lastSeen ? String(item.firstSeen) : `${item.firstSeen}–${item.lastSeen}`, String(item.count)];
    for (let index = 0; index < cells.length; index += 1) {
      const td = document.createElement('td');
      if (index === 0 || index === 1) td.append(cells[index]); else td.textContent = cells[index];
      if (index === 2) td.title = item.rawLine;
      row.append(td);
    }
    tbody.append(row);
  }
}
