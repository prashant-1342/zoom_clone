import { Meeting, User, ChatMessage } from '@/types';

export const defaultUser: User = {
  id: 'usr_alex_morgan_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@zoomflow.internal',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Engineering Lead',
  created_at: new Date().toISOString()
};

const now = new Date();

export let initialMeetings: Meeting[] = [
  {
    id: 'mtg_01',
    meeting_number: '8429103849',
    topic: 'Frontend Architecture Review & Zoom UI Sync',
    description: 'Weekly deep dive into Next.js components, WebRTC signaling performance, and user interface responsiveness.',
    passcode: '489201',
    meeting_type: 'scheduled',
    status: 'upcoming',
    start_time: new Date(now.getTime() + 2 * 3600 * 1000).toISOString(),
    duration_minutes: 45,
    created_at: now.toISOString(),
    host: defaultUser
  },
  {
    id: 'mtg_02',
    meeting_number: '6219803124',
    topic: 'Product Demo: Real-time Audio/Video Collaboration',
    description: 'Live walkthrough of participant tile rendering, active speaker switching, and screen sharing features.',
    passcode: '773104',
    meeting_type: 'scheduled',
    status: 'upcoming',
    start_time: new Date(now.getTime() + 28 * 3600 * 1000).toISOString(),
    duration_minutes: 30,
    created_at: now.toISOString(),
    host: defaultUser
  },
  {
    id: 'mtg_03',
    meeting_number: '5129984321',
    topic: 'Sprint Planning & Backlog Grooming',
    description: 'Bi-weekly sprint planning session for upcoming media engine and host controls enhancements.',
    passcode: '512998',
    meeting_type: 'scheduled',
    status: 'upcoming',
    start_time: new Date(now.getTime() + 49 * 3600 * 1000).toISOString(),
    duration_minutes: 60,
    created_at: now.toISOString(),
    host: defaultUser
  },
  {
    id: 'mtg_04',
    meeting_number: '1940228371',
    topic: 'Design System Alignment & Token Standardization',
    description: 'Reviewing Zoom dark theme palette, control bar ergonomics, and modal dialog polish.',
    passcode: '194022',
    meeting_type: 'scheduled',
    status: 'ended',
    start_time: new Date(now.getTime() - 27 * 3600 * 1000).toISOString(),
    duration_minutes: 40,
    created_at: new Date(now.getTime() - 27 * 3600 * 1000).toISOString(),
    host: defaultUser
  },
  {
    id: 'mtg_05',
    meeting_number: '8203114920',
    topic: 'Quick Standup & Daily Sync',
    description: 'Daily standup meeting to coordinate blocker resolution and feature branch merges.',
    passcode: '820311',
    meeting_type: 'instant',
    status: 'ended',
    start_time: new Date(now.getTime() - 53 * 3600 * 1000).toISOString(),
    duration_minutes: 15,
    created_at: new Date(now.getTime() - 53 * 3600 * 1000).toISOString(),
    host: defaultUser
  }
];

export const messagesStore: Record<string, ChatMessage[]> = {};
