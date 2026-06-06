import fs from 'fs';
import path from 'path';

let knowledgeBase = [];
let isReady = false;

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
}

function termFreq(tokens) {
  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }
  return freq;
}

function scoreDoc(queryTokens, docTokens) {
  const docFreq = termFreq(docTokens);
  const queryFreq = termFreq(queryTokens);
  let score = 0;
  let matched = 0;

  for (const qt of Object.keys(queryFreq)) {
    if (docFreq[qt]) {
      score += Math.min(docFreq[qt], 3) * queryFreq[qt];
      matched++;
    }
  }

  const queryLen = Object.keys(queryFreq).length;
  if (queryLen === 0) return 0;
  return (score / (queryLen * 3)) * (matched / queryLen);
}

export async function initRAG() {
  if (isReady) return;
  console.log('Initializing RAG pipeline...');

  const dataPath = path.join(process.cwd(), 'lib', 'data', 'knowledge.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  knowledgeBase = data.documents.map(doc => ({
    ...doc,
    tokens: tokenize(doc.content),
  }));

  isReady = true;
  console.log(`RAG ready with ${knowledgeBase.length} documents`);
}

export async function search(query, topK = 5) {
  if (!isReady) await initRAG();

  const queryTokens = tokenize(query);

  const scored = knowledgeBase.map(doc => ({
    ...doc,
    score: scoreDoc(queryTokens, doc.tokens),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(d => d.score > 0.01);
}

export async function getContext(query) {
  const results = await search(query, 5);

  if (results.length === 0) {
    return { context: '', sources: [] };
  }

  const context = results
    .map(r => `[Source: ${r.source}${r.repo ? ` — ${r.repo}` : ''}${r.section ? ` — ${r.section}` : ''}]\n${r.content}`)
    .join('\n\n');

  const sources = results.map(r => ({
    source: r.source,
    repo: r.repo || null,
    section: r.section || null,
    url: r.url || null,
    score: Math.round(r.score * 100) / 100,
  }));

  return { context, sources };
}
