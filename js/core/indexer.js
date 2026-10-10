export const MAX_BYTES = 20 * 1024 * 1024;

export function bytesIn(text) {
  return new TextEncoder().encode(text).byteLength;
}

export function assertWithinLimit(text, maxBytes = MAX_BYTES) {
  const size = bytesIn(text);
  if (size > maxBytes) {
    const error = new Error(`This log is ${formatMiB(size)} MiB; the limit is ${formatMiB(maxBytes)} MiB. Trim the log and try again.`);
    error.code = 'FILE_TOO_LARGE';
    error.bytes = size;
    throw error;
  }
  return size;
}

export function indexLines(text) {
  return text.split(/\r\n|\n|\r/).map((rawLine, index) => ({
    lineNumber: index + 1,
    rawLine,
    parseLine: index === 0 ? rawLine.replace(/^\uFEFF/, '') : rawLine,
  }));
}

export function formatMiB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}
