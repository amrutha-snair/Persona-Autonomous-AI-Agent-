'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! 👋 I'm Amrutha's AI representative. I can answer questions about her background, skills, GitHub projects, and help schedule an interview. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 'session-' + Date.now());
  const [callState, setCallState] = useState('idle');
  const vapiRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const describeError = (e) => {
    if (!e) return 'unknown error';
    if (typeof e === 'string') return e;
    const fields = ['message', 'errorMsg', 'error', 'errorStage', 'reason', 'action', 'callClientId', 'type'];
    const out = {};
    for (const k of fields) if (e[k] !== undefined) out[k] = e[k];
    if (Object.keys(out).length === 0) {
      try { return JSON.stringify(e, Object.getOwnPropertyNames(e)); } catch { return String(e); }
    }
    return out;
  };

  const getVapi = async () => {
    if (vapiRef.current) return vapiRef.current;
    if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
      alert('Voice not configured: set NEXT_PUBLIC_VAPI_PUBLIC_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local');
      return null;
    }
    const { default: Vapi } = await import('@vapi-ai/web');
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapi.on('call-start', () => setCallState('in-call'));
    vapi.on('call-end', () => setCallState('idle'));
    vapi.on('error', (e) => {
      const detail = describeError(e);
      const msg = JSON.stringify(detail).toLowerCase();
      const benign = msg.includes('meeting has ended') || msg.includes('ejected') || msg.includes('left meeting');
      if (benign) {
        console.log('Vapi call ended:', detail);
      } else {
        console.error('Vapi error:', detail, 'raw:', e);
        alert('Voice call failed:\n' + (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)));
      }
      setCallState('idle');
    });
    vapiRef.current = vapi;
    return vapi;
  };

  const toggleCall = async () => {
    if (callState === 'in-call' || callState === 'connecting') {
      setCallState('ending');
      vapiRef.current?.stop();
      return;
    }
    const vapi = await getVapi();
    if (!vapi) return;
    setCallState('connecting');
    try {
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      const detail = describeError(err);
      console.error('Call start failed:', detail, 'raw:', err);
      alert('Could not start call:\n' + (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)));
      setCallState('idle');
    }
  };

  useEffect(() => {
    return () => { vapiRef.current?.stop(); };
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg.trim() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.trim(), sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    "Why is Amrutha a good fit for an AI engineering role?",
    "Tell me about her GitHub projects",
    "What's her research experience?",
    "I'd like to book an interview",
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>AS</div>
          <div>
            <h1 className={styles.title}>Amrutha Satheesan</h1>
            <p className={styles.subtitle}>AI/ML Engineer · IIT Ropar Researcher</p>
          </div>
        </div>
        <div className={styles.badge}>RAG-Grounded</div>
      </header>

      <main className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.bubble}>
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line || ' '}</p>
              ))}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className={styles.sources}>
                {msg.sources.map((s, j) => (
                  <span key={j} className={styles.sourceTag}>
                    📎 {s.repo || s.section || s.source}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {messages.length <= 1 && (
        <div className={styles.quickWrap}>
          {quickQuestions.map((q, i) => (
            <button key={i} className={styles.quickBtn} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <footer className={styles.inputArea}>
        <button
          className={styles.callBtn}
          onClick={toggleCall}
          data-state={callState}
          title={callState === 'in-call' ? 'End call' : 'Start voice call'}
        >
          {callState === 'in-call' ? '⏹ End' : callState === 'connecting' ? '…' : '📞 Call'}
        </button>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about skills, projects, or book an interview..."
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
