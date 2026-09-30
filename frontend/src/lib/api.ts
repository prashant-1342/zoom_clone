import { Meeting, User, ChatMessage } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchDashboard(): Promise<{
  user: User;
  upcoming_meetings: Meeting[];
  recent_meetings: Meeting[];
}> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/dashboard` : '/api/dashboard';
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
}

export async function fetchUpcomingMeetings(): Promise<Meeting[]> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/upcoming` : '/api/meetings/upcoming';
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch upcoming meetings');
  }
  return res.json();
}

export async function fetchRecentMeetings(): Promise<Meeting[]> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/recent` : '/api/meetings/recent';
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch recent meetings');
  }
  return res.json();
}

export async function createInstantMeeting(topic?: string, hostName?: string): Promise<Meeting> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/instant` : '/api/meetings/instant';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic || 'Instant Meeting',
      host_name: hostName || 'Alex Morgan'
    })
  });
  if (!res.ok) {
    throw new Error('Failed to create instant meeting');
  }
  return res.json();
}

export async function scheduleMeeting(data: {
  topic: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  passcode?: string;
  host_name?: string;
}): Promise<Meeting> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/schedule` : '/api/meetings/schedule';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to schedule meeting');
  }
  return res.json();
}

export async function validateMeeting(data: {
  meeting_identifier: string;
  passcode?: string;
  user_name: string;
}): Promise<{
  valid: boolean;
  id: string;
  meeting_number: string;
  topic: string;
  host_id?: string;
  status: string;
  requires_passcode: boolean;
}> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/validate` : '/api/meetings/validate';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Meeting validation failed');
  }
  return res.json();
}

export async function getMeetingDetails(identifier: string): Promise<Meeting> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/${identifier}` : `/api/meetings/${identifier}`;
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Meeting not found');
  }
  return res.json();
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/${meetingId}` : `/api/meetings/${meetingId}`;
  const res = await fetch(endpoint, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error('Failed to delete meeting');
  }
}

export async function getMeetingMessages(meetingId: string): Promise<ChatMessage[]> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/meetings/${meetingId}/messages` : `/api/meetings/${meetingId}/messages`;
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export function getWebSocketUrl(meetingId: string, clientId: string, userName: string, role: string, isMuted: boolean, isCameraOff: boolean): string {
  if (API_BASE_URL) {
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
    const host = API_BASE_URL.replace(/^http(s)?:\/\//, '');
    return `${wsProtocol}//${host}/ws/${meetingId}/${clientId}?user_name=${encodeURIComponent(userName)}&role=${encodeURIComponent(role)}&is_muted=${isMuted}&is_camera_off=${isCameraOff}`;
  }
  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws/${meetingId}/${clientId}?user_name=${encodeURIComponent(userName)}&role=${encodeURIComponent(role)}&is_muted=${isMuted}&is_camera_off=${isCameraOff}`;
  }
  return '';
}
