'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        <div className={styles.badge}>📞 +1 (254) 261-0487</div>
      </header>

      <main className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.bubble}>
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line || ' '}</p>
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
