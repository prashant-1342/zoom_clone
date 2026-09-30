import { NextResponse } from 'next/server';
import { messagesStore } from '@/lib/serverStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const messages = messagesStore[resolved.id] || [];
  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const body = await req.json().catch(() => ({}));

  if (!messagesStore[resolved.id]) {
    messagesStore[resolved.id] = [];
  }

  const newMsg = {
    id: `msg_${Date.now()}`,
    sender_name: body.sender_name || 'Alex Morgan',
    sender_id: body.sender_id || 'guest',
    text: body.text || '',
    created_at: new Date().toISOString()
  };

  messagesStore[resolved.id].push(newMsg);
  return NextResponse.json(newMsg);
}
