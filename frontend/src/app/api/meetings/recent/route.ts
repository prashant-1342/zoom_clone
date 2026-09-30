import { NextResponse } from 'next/server';
import { initialMeetings } from '@/lib/serverStore';

export async function GET() {
  const recent = initialMeetings.filter(m => m.status === 'ended');
  return NextResponse.json(recent);
}
