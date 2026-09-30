import { NextResponse } from 'next/server';
import { initialMeetings, defaultUser } from '@/lib/serverStore';
import { Meeting } from '@/types';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const meetingNumber = `${Math.floor(100 + Math.random() * 900)}${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}`;
  const passcode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newMeeting: Meeting = {
    id: `mtg_${Date.now()}`,
    meeting_number: meetingNumber,
    topic: body.topic || `${defaultUser.name}'s Personal Meeting Room`,
    description: 'Instant video conference session',
    passcode: passcode,
    meeting_type: 'instant',
    status: 'live',
    start_time: new Date().toISOString(),
    duration_minutes: 45,
    created_at: new Date().toISOString(),
    host: defaultUser
  };

  initialMeetings.unshift(newMeeting);
  return NextResponse.json(newMeeting);
}
