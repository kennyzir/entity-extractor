// ClawHub Local Skill - runs entirely in your agent, no API key required
// Entity Extractor (NER) - Extract people, orgs, locations, dates, emails, URLs, money

interface Entity { text: string; type: string; start: number; end: number; }

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const m of text.matchAll(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g))
    entities.push({ text: m[0], type: 'EMAIL', start: m.index!, end: m.index! + m[0].length });
  for (const m of text.matchAll(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g))
    entities.push({ text: m[0], type: 'URL', start: m.index!, end: m.index! + m[0].length });
  for (const m of text.matchAll(/\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi))
    entities.push({ text: m[0], type: 'DATE', start: m.index!, end: m.index! + m[0].length });
  for (const m of text.matchAll(/[$€£¥]\s?\d[\d,]*\.?\d*\b|\b\d[\d,]*\.?\d*\s?(?:USD|EUR|GBP|JPY|CNY)\b/gi))
    entities.push({ text: m[0], type: 'MONEY', start: m.index!, end: m.index! + m[0].length });
  for (const m of text.matchAll(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g)) {
    if (m[0].replace(/\D/g, '').length >= 7) entities.push({ text: m[0].trim(), type: 'PHONE', start: m.index!, end: m.index! + m[0].length });
  }
  const locWords = ['Street','Avenue','Road','City','County','State','Park','Lake','Mountain','River','Island','Bay'];
  const orgWords = ['Inc','Corp','Ltd','LLC','Company','Group','Foundation','Institute','University','Association'];
  for (const m of text.matchAll(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g)) {
    if (entities.some(e => m.index! >= e.start && m.index! < e.end)) continue;
    let type = 'PERSON';
    if (orgWords.some(w => m[0].includes(w))) type = 'ORGANIZATION';
    else if (locWords.some(w => m[0].includes(w))) type = 'LOCATION';
    entities.push({ text: m[0], type, start: m.index!, end: m.index! + m[0].length });
  }
  entities.sort((a, b) => a.start - b.start);
  return entities;
}

export async function run(input: { text: string }) {
  if (!input.text || typeof input.text !== 'string' || input.text.length < 1) throw new Error('text is required');
  if (input.text.length > 50000) throw new Error('Text too long (max 50,000 chars)');
  const startTime = Date.now();
  const entities = extractEntities(input.text);
  const grouped: Record<string, string[]> = {};
  for (const e of entities) { if (!grouped[e.type]) grouped[e.type] = []; if (!grouped[e.type].includes(e.text)) grouped[e.type].push(e.text); }
  return {
    entities, grouped, total_count: entities.length,
    type_counts: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
    _meta: { skill: 'entity-extractor', latency_ms: Date.now() - startTime, text_length: input.text.length },
  };
}
export default run;
