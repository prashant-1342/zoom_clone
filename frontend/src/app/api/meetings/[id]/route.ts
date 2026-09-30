import { NextResponse } from 'next/server';
import { initialMeetings, defaultUser } from '@/lib/serverStore';
import { Meeting } from '@/types';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const idOrNumber = (resolved.id || '').replace(/[^a-zA-Z0-9]/g, '').trim();

  let meeting = initialMeetings.find(
    m => m.id === idOrNumber || m.meeting_number === idOrNumber
  );

  if (!meeting) {
    meeting = {
      id: `mtg_${idOrNumber}`,
      meeting_number: idOrNumber,
      topic: 'Live Video Session',
      description: 'Zoom conference meeting room',
      passcode: '123456',
      meeting_type: 'instant',
      status: 'live',
      start_time: new Date().toISOString(),
      duration_minutes: 45,
      created_at: new Date().toISOString(),
      host: defaultUser
    };
    initialMeetings.unshift(meeting);
  }

  return NextResponse.json(meeting);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const index = initialMeetings.findIndex(m => m.id === resolved.id || m.meeting_number === resolved.id);
  if (index !== -1) {
    initialMeetings.splice(index, 1);
  }
  return NextResponse.json({ success: true });
}
