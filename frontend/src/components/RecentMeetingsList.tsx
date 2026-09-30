'use client';

import React from 'react';
import { Meeting } from '@/types';
import { ClockIcon, VideoIcon } from '@/components/Icons';

interface RecentMeetingsListProps {
  meetings: Meeting[];
  onStartMeeting: (meeting: Meeting) => void;
}

export default function RecentMeetingsList({
  meetings,
  onStartMeeting
}: RecentMeetingsListProps) {
  const formatRecentDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#1f222a] border border-gray-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Meetings</h2>
            <p className="text-xs text-gray-400">Past call history and recorded rooms</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
          {meetings.length} Recorded
        </span>
      </div>

      {meetings.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <p className="text-sm">No recent meetings recorded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/80 mt-2">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="py-3 flex items-center justify-between gap-3 group hover:bg-[#262a34]/40 px-2 rounded-xl transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-400">
                    {formatRecentDate(meeting.start_time || meeting.created_at)}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    • {meeting.duration_minutes || 30} mins
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate mt-0.5">
                  {meeting.topic}
                </h4>
                <div className="text-xs font-mono text-gray-400 mt-0.5">
                  ID: {meeting.meeting_number.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                </div>
              </div>

              <button
                onClick={() => onStartMeeting(meeting)}
                className="px-3 py-1.5 bg-[#2d323f] hover:bg-[#0e71eb] text-gray-200 hover:text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0"
              >
                <VideoIcon className="w-3.5 h-3.5" />
                Rejoin
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
