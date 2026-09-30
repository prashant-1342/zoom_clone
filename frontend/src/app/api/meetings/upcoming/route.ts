import { NextResponse } from 'next/server';
import { initialMeetings } from '@/lib/serverStore';

export async function GET() {
  const upcoming = initialMeetings.filter(m => m.status === 'upcoming');
  return NextResponse.json(upcoming);
}
