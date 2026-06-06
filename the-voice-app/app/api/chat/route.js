import { chat } from '@/lib/agent';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'message and sessionId are required' },
        { status: 400 }
      );
    }

    const result = await chat(sessionId, message);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Chat API uncaught error:', err);
    return NextResponse.json(
      {
        error: 'unexpected',
        reply: "Something went wrong on my end. Try again in a moment, or reach Amrutha at amruthasnair0502@gmail.com.",
        sources: [],
      },
      { status: 200 }
    );
  }
}
