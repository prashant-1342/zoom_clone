'use client';

import React, { useState } from 'react';
import { Meeting } from '@/types';
import { CopyIcon, CheckIcon, TrashIcon, CalendarIcon, VideoIcon } from '@/components/Icons';

interface UpcomingMeetingsListProps {
  meetings: Meeting[];
  onStartMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
}

export default function UpcomingMeetingsList({
  meetings,
  onStartMeeting,
  onDeleteMeeting
}: UpcomingMeetingsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatMeetingTime = (dateStr?: string) => {
    if (!dateStr) return 'Flexible / Anytime';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyInvitation = (meeting: Meeting) => {
    const inviteText = `Topic: ${meeting.topic}\nMeeting ID: ${meeting.meeting_number}\nPasscode: ${meeting.passcode || 'None'}\nJoin Link: ${window.location.origin}/meeting/${meeting.meeting_number}`;
    navigator.clipboard.writeText(inviteText);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#1f222a] border border-gray-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Upcoming Meetings</h2>
            <p className="text-xs text-gray-400">Scheduled sessions and calendar invites</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
          {meetings.length} Total
        </span>
      </div>

      {meetings.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <CalendarIcon className="w-10 h-10 mx-auto text-gray-600 mb-3" />
          <p className="text-sm font-medium">No upcoming meetings scheduled</p>
          <p className="text-xs text-gray-500 mt-1">Click &quot;Schedule&quot; above to create a new one.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/80 mt-2">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[#262a34]/40 px-2 rounded-xl transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                    {formatMeetingTime(meeting.start_time)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({meeting.duration_minutes} min)
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mt-1.5 truncate group-hover:text-blue-300 transition">
                  {meeting.topic}
                </h3>

                {meeting.description && (
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                    {meeting.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                  <div>
                    <span className="text-gray-500">Meeting ID: </span>
                    <span className="font-mono text-gray-300 select-all font-medium">
                      {meeting.meeting_number.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                    </span>
                  </div>
                  {meeting.passcode && (
                    <div>
                      <span className="text-gray-500">Passcode: </span>
                      <span className="font-mono text-gray-300 font-medium">
                        {meeting.passcode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onStartMeeting(meeting)}
                  className="px-4 py-2 bg-[#0e71eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
                >
                  <VideoIcon className="w-3.5 h-3.5" />
                  Start
                </button>

                <button
                  onClick={() => copyInvitation(meeting)}
                  title="Copy Invitation Link"
                  className="p-2 bg-[#2d323f] hover:bg-[#383e4d] text-gray-300 hover:text-white rounded-lg text-xs transition flex items-center gap-1"
                >
                  {copiedId === meeting.id ? (
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => onDeleteMeeting(meeting.id)}
                  title="Delete Meeting"
                  className="p-2 bg-[#2d323f] hover:bg-rose-900/40 text-gray-400 hover:text-rose-400 rounded-lg text-xs transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
