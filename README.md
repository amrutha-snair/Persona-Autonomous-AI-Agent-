# Amrutha AI Persona

End-to-end AI persona of **Amrutha Satheesan** that you can **call**, **chat with**, and use to **book an interview** — fully autonomous, no human in the loop.


---

## Live Demos

| Channel | Link |
|---|---|
| Chat | *https://the-voice-app.vercel.app/* |
| Phone (US) | **+1 (254) 261-0487** *(call free via WhatsApp / Skype)* |
| Browser voice | Click **Call** on the chat page |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                          USERS                                  │
│  Phone call             Chat browser           Web call         │
│       │                       │                      │          │
│       ▼                       ▼                      ▼          │
│  ┌─────────┐          ┌─────────────┐          ┌─────────┐     │
│  │  Vapi   │          │  Next.js UI │          │  Vapi   │     │
│  │ (phone) │          │ /app/page.js│          │ Web SDK │     │
│  └────┬────┘          └──────┬──────┘          └────┬────┘     │
│       │                      │                      │          │
│       ▼                      ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────┐      │
│  │            Next.js API routes (Vercel)                │      │
│  │   ┌────────────────┐      ┌─────────────────────┐    │      │
│  │   │ /api/chat      │      │ /api/vapi/chat      │    │      │
│  │   │ (chat UI)      │      │ (Vapi Custom LLM)   │    │      │
│  │   └────────┬───────┘      └─────────┬───────────┘    │      │
│  │            └────────────┬───────────┘                 │      │
│  │                         ▼                             │      │
│  │     ┌─────────────────────────────────────┐          │      │
│  │     │   lib/agent.js  (Gemini 2.5-flash)  │          │      │
│  │     │   • RAG-grounded persona             │          │      │
│  │     │   • Tools: check_availability, book  │          │      │
│  │     └────┬──────────────────┬────────┬─────┘          │      │
│  │          ▼                  ▼        ▼                │      │
│  │   ┌───────────┐    ┌──────────────┐ ┌─────────┐      │      │
│  │   │ lib/rag.js│    │ lib/calendar │ │ Friendly│      │      │
│  │   │ (TF-IDF)  │    │  (Cal.com)   │ │ errors  │      │      │
│  │   └─────┬─────┘    └──────────────┘ └─────────┘      │      │
│  │         ▼                                             │      │
│  │   lib/data/knowledge.json                             │      │
│  │   (resume + GitHub repo summaries)                    │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 + React 19 | App router, server components, Vercel-native |
| Voice (phone + web) | Vapi (Deepgram STT + ElevenLabs/Vapi TTS + Custom LLM) | <2s latency, free tier, easy phone integration |
| LLM | Google Gemini 2.5-flash | Free tier, fast, function-calling support |
| RAG | In-memory TF-IDF over JSON corpus | Zero infra, deterministic, ~5ms retrieval |
| Calendar | Cal.com v2 API | Free, REST API, real bookings |
| Hosting | Vercel | Free, serverless, instant deploy |

---

## Project Structure

```
the-voice-app/
├── app/
│   ├── api/
│   │   ├── chat/route.js          # Chat UI endpoint
│   │   └── vapi/chat/route.js     # Vapi Custom-LLM webhook
│   ├── layout.js
│   ├── page.js                    # Chat UI + web-call button
│   └── globals.css
└── lib/
    ├── agent.js                   # Gemini agent + system prompt + tools
    ├── rag.js                     # TF-IDF retrieval
    ├── calendar.js                # Cal.com integration
    ├── config.js                  # Env config
    └── data/knowledge.json        # Resume + GitHub corpus
```

---

## Setup (local)

```bash
git clone https://github.com/YOUR-USERNAME/amrutha-ai-persona
cd amrutha-ai-persona
npm install
cp .env.example .env.local        # then fill keys
npm run dev                       # http://localhost:5005
```

### Required environment variables

```
GEMINI_API_KEY=                   # https://aistudio.google.com/apikey
CAL_API_KEY=                      # https://app.cal.com → Settings → Developer
CAL_EVENT_TYPE_ID=                # Your interview event-type ID

NEXT_PUBLIC_VAPI_PUBLIC_KEY=      # Vapi dashboard → API Keys → Public Key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=    # Vapi dashboard → Assistants → ID
```

### Vapi configuration

In your Vapi assistant settings:
- **Model**: Custom LLM
- **URL**: `https://YOUR-APP.vercel.app/api/vapi/chat`
- **Transcriber**: Deepgram Nova-3
- **Voice**: ElevenLabs (or Vapi default)
- **First Message**: *"Hi! I'm Amrutha's AI representative — how can I help?"*

---

## Cost Breakdown

| Item | Cost |
|---|---|
| Per voice call (3 min) | ~$0.42 (Vapi: STT $0.03 + LLM $0.18 + TTS $0.06 + Telephony $0.15) |
| Per chat session (10 msgs) | ~$0.001 (Gemini 2.5-flash free tier covers most usage) |
| RAG retrieval | $0 (in-memory TF-IDF) |
| Vercel hosting | $0 (Hobby tier) |
| Cal.com | $0 (free plan) |
| **Monthly fixed cost** | **$0** |

---

## Evals

See [`EVAL_REPORT.pdf`](./EVAL_REPORT.pdf) for:
- First-response voice latency (n=10 calls)
- Transcription accuracy + booking success rate
- Chat hallucination rate (golden Q&A set, judge-model scored)
- Retrieval precision/recall
- 3 failure modes + root causes + fixes
- One conscious tradeoff
- 2-week roadmap

---

## License

MIT
