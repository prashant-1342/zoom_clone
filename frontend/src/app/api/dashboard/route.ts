import { NextResponse } from 'next/server';
import { defaultUser, initialMeetings } from '@/lib/serverStore';

export async function GET() {
  const upcoming = initialMeetings.filter(m => m.status === 'upcoming');
  const recent = initialMeetings.filter(m => m.status === 'ended');

  return NextResponse.json({
    user: defaultUser,
    upcoming_meetings: upcoming,
    recent_meetings: recent
  });
}
