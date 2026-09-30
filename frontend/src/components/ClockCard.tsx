'use client';

import React, { useState, useEffect } from 'react';
import { Meeting } from '@/types';

interface ClockCardProps {
  nextMeeting?: Meeting;
  onStartMeeting?: (meeting: Meeting) => void;
}

export default function ClockCard({ nextMeeting, onStartMeeting }: ClockCardProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c2942] via-[#162035] to-[#0f172a] border border-blue-900/30 p-6 sm:p-8 text-white shadow-xl min-h-[200px] flex flex-col justify-between">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      
      <div>
        <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow">
          {timeStr || '12:00 PM'}
        </div>
        <div className="text-sm sm:text-base font-medium text-blue-200/80 mt-1">
          {dateStr || 'Wednesday, September 30'}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {nextMeeting ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  Next Scheduled Call
                </span>
              </div>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {nextMeeting.topic}
              </p>
            </div>

            <button
              onClick={() => onStartMeeting?.(nextMeeting)}
              className="px-4 py-2 bg-[#0e71eb] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition shrink-0"
            >
              Start
            </button>
          </>
        ) : (
          <div className="text-xs text-gray-400">
            No upcoming meetings right now
          </div>
        )}
      </div>
    </div>
  );
}
