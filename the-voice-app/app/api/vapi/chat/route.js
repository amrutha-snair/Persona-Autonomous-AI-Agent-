import { chat } from '@/lib/agent';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const userMessage = (lastUser?.content || '').trim();

    if (!userMessage) {
      return NextResponse.json(openAiCompletion("Sorry, I didn't catch that — could you repeat?"));
    }

    const sessionId = body?.call?.id || body?.callId || `vapi-${Date.now()}`;

    const result = await chat(sessionId, userMessage);
    return NextResponse.json(openAiCompletion(result.reply));
  } catch (err) {
    console.error('Vapi webhook error:', err);
    return NextResponse.json(
      openAiCompletion("I'm having trouble right now — please call back in a moment."),
      { status: 200 }
    );
  }
}

function openAiCompletion(text) {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'amrutha-persona',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      },
    ],
  };
}
