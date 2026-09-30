import { NextResponse } from 'next/server';
import { initialMeetings } from '@/lib/serverStore';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idOrNumber = (body.meeting_identifier || '').replace(/[^a-zA-Z0-9]/g, '').trim();

  const meeting = initialMeetings.find(
    m => m.id === idOrNumber || m.meeting_number === idOrNumber
  );

  if (!meeting) {
    return NextResponse.json({ detail: 'Meeting not found' }, { status: 404 });
  }

  if (meeting.passcode && body.passcode) {
    if (meeting.passcode.toLowerCase() !== body.passcode.toLowerCase()) {
      return NextResponse.json({ detail: 'Invalid meeting passcode' }, { status: 403 });
    }
  }

  return NextResponse.json({
    valid: true,
    id: meeting.id,
    meeting_number: meeting.meeting_number,
    topic: meeting.topic,
    host_id: meeting.host?.id,
    status: meeting.status,
    requires_passcode: !!meeting.passcode
  });
}
