import { NextResponse } from 'next/server';
import { initialMeetings, defaultUser } from '@/lib/serverStore';
import { Meeting } from '@/types';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.topic) {
    return NextResponse.json({ detail: 'Topic is required' }, { status: 400 });
  }

  const meetingNumber = `${Math.floor(100 + Math.random() * 900)}${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}`;
  const passcode = body.passcode || Math.random().toString(36).substring(2, 8).toUpperCase();

  const newMeeting: Meeting = {
    id: `mtg_${Date.now()}`,
    meeting_number: meetingNumber,
    topic: body.topic,
    description: body.description || '',
    passcode: passcode,
    meeting_type: 'scheduled',
    status: 'upcoming',
    start_time: body.start_time,
    duration_minutes: body.duration_minutes || 30,
    created_at: new Date().toISOString(),
    host: defaultUser
  };

  initialMeetings.unshift(newMeeting);
  return NextResponse.json(newMeeting);
}
