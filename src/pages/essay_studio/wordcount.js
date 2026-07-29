// Mirrors api/_lib/wordcount.mjs's proseWordCount for live client-side display.
export function proseWordCount(body) {
  const prose = [];
  let inCodeBlock = false;
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (line.startsWith('#') || line.startsWith('<!--') || line.startsWith('>')) continue;
    prose.push(line);
  }
  const matches = prose.join(' ').match(/\b[A-Za-z0-9'-]+\b/g);
  return matches ? matches.length : 0;
}

export default proseWordCount;
