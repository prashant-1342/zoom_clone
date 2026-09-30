export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  meeting_number: string;
  topic: string;
  description?: string;
  passcode?: string;
  meeting_type: 'instant' | 'scheduled';
  status: 'upcoming' | 'live' | 'ended';
  start_time?: string;
  duration_minutes: number;
  created_at: string;
  host?: User;
  participants_count?: number;
}

export interface Participant {
  client_id: string;
  user_id: string;
  user_name: string;
  role: 'host' | 'participant';
  is_muted: boolean;
  is_camera_off: boolean;
  is_screen_sharing?: boolean;
  raised_hand?: boolean;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  sender_name: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface ReactionItem {
  id: string;
  user_name: string;
  emoji: string;
}
