// Quick chat groundedness eval against live Vercel URL.
// Run: node scripts/eval-golden.js
// Output: console table of per-question score + summary metrics.

const ENDPOINT = process.env.EVAL_ENDPOINT || 'https://the-voice-app.vercel.app/api/chat';

const GOLDEN = [
  { q: "What is Amrutha's CGPA?", expect: ['8.5'], type: 'fact' },
  { q: "Where does Amrutha study?", expect: ['NIMS', 'Jaipur'], type: 'fact' },
  { q: "What accuracy did the yoga pose classifier achieve?", expect: ['96.70', '96.7'], type: 'fact' },
  { q: "What dataset did the yoga research use?", expect: ['Yoga-82', '28,000', '28000'], type: 'fact' },
  { q: "Which conference accepted her publications?", expect: ['CVIP'], type: 'fact' },
  { q: "What tech stack does GemChat use?", expect: ['React', 'Gemini', 'Node'], type: 'project' },
  { q: "What's the design tradeoff in Concept-Simplifier?", expect: ['Ollama', 'privacy'], type: 'project' },
  { q: "How many platforms did her automation framework cover?", expect: ['6', 'six'], type: 'fact' },
  { q: "Does Amrutha know Rust?", expect: ["don't have", 'not', 'no '], type: 'unknown', refuse: true },
  { q: "What is her favorite movie?", expect: ["don't have", 'not'], type: 'unknown', refuse: true },
];

function scoreReply(reply, q) {
  const text = (reply || '').toLowerCase();
  if (q.refuse) {
    const refused = q.expect.some((kw) => text.includes(kw.toLowerCase()));
    return { passed: refused, why: refused ? 'correctly refused' : 'hallucinated answer' };
  }
  const hits = q.expect.filter((kw) => text.includes(kw.toLowerCase()));
  const passed = hits.length > 0;
  return { passed, why: passed ? `matched: ${hits.join(', ')}` : `missing all of: ${q.expect.join(', ')}` };
}

async function ask(q) {
  const t0 = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: q.q, sessionId: `eval-${Math.random().toString(36).slice(2)}` }),
  });
  const data = await res.json();
  const latency = Date.now() - t0;
  return { reply: data.reply, sources: data.sources || [], latency };
}

(async () => {
  const results = [];
  for (const q of GOLDEN) {
    const { reply, sources, latency } = await ask(q);
    const { passed, why } = scoreReply(reply, q);
    results.push({ q: q.q, type: q.type, passed, why, latency, sources: sources.length });
    console.log(`[${passed ? '✅' : '❌'}] (${latency}ms) ${q.q}`);
    console.log(`     reply: ${reply?.slice(0, 120)}...`);
    console.log(`     ${why}\n`);
    // small delay to respect Gemini free-tier RPM
    await new Promise((r) => setTimeout(r, 4000));
  }

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const factPassed = results.filter((r) => r.type === 'fact' && r.passed).length;
  const factTotal = results.filter((r) => r.type === 'fact').length;
  const refused = results.filter((r) => r.type === 'unknown' && r.passed).length;
  const refusedTotal = results.filter((r) => r.type === 'unknown').length;
  const projectPassed = results.filter((r) => r.type === 'project' && r.passed).length;
  const projectTotal = results.filter((r) => r.type === 'project').length;
  const avgLatency = Math.round(results.reduce((s, r) => s + r.latency, 0) / total);
  const p95 = results.map((r) => r.latency).sort((a, b) => a - b)[Math.floor(total * 0.95)] || 0;

  console.log('\n========= SUMMARY =========');
  console.log(`Overall pass rate:        ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Fact accuracy:            ${factPassed}/${factTotal}`);
  console.log(`Project knowledge:        ${projectPassed}/${projectTotal}`);
  console.log(`Honest refusal (unknown): ${refused}/${refusedTotal}  ← hallucination resistance`);
  console.log(`Avg latency:              ${avgLatency}ms`);
  console.log(`P95 latency:              ${p95}ms`);
  console.log(`Hallucination rate:       ${refusedTotal ? ((1 - refused / refusedTotal) * 100).toFixed(0) : 0}% (lower = better)`);
  console.log('===========================');
})();
