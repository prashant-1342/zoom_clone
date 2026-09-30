'use client';

import React, { useState } from 'react';
import { VideoIcon, PlusIcon, CalendarIcon, ShareScreenIcon, ChevronDownIcon } from '@/components/Icons';

interface ActionCardsProps {
  onNewMeeting: (withVideo: boolean) => void;
  onJoinMeeting: () => void;
  onScheduleMeeting: () => void;
  onShareScreen: () => void;
}

export default function ActionCards({
  onNewMeeting,
  onJoinMeeting,
  onScheduleMeeting,
  onShareScreen
}: ActionCardsProps) {
  const [newMeetingDropdown, setNewMeetingDropdown] = useState(false);
  const [startWithVideo, setStartWithVideo] = useState(true);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-2">
      
      <div className="relative group flex flex-col items-center">
        <div className="flex w-full max-w-[130px] aspect-square rounded-2xl bg-[#f26d21] text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 hover:scale-[1.03] transition-all duration-200 overflow-hidden relative">
          <button
            onClick={() => onNewMeeting(startWithVideo)}
            className="flex-1 flex flex-col items-center justify-center p-3 w-full h-full cursor-pointer"
          >
            <VideoIcon className="w-9 h-9 sm:w-11 sm:h-11 mb-1 drop-shadow" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNewMeetingDropdown(!newMeetingDropdown);
            }}
            className="absolute top-2 right-2 p-1 rounded-md bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition"
            title="Meeting options"
          >
            <ChevronDownIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
          New Meeting
        </span>

        {newMeetingDropdown && (
          <div
            className="absolute top-full mt-2 left-0 w-60 bg-[#242731] text-gray-200 border border-gray-700/80 rounded-xl shadow-2xl p-2 z-40 text-xs animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#2d323f] rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={startWithVideo}
                onChange={(e) => setStartWithVideo(e.target.checked)}
                className="rounded border-gray-600 text-[#0e71eb] focus:ring-0 w-4 h-4 accent-[#0e71eb]"
              />
              <span className="font-medium text-gray-200">Start with video</span>
            </label>
            <div className="border-t border-gray-700/60 my-1"></div>
            <button
              onClick={() => {
                setNewMeetingDropdown(false);
                onNewMeeting(startWithVideo);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#2d323f] rounded-lg font-medium text-blue-400"
            >
              Start Instant Room Now
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={onJoinMeeting}
          className="w-full max-w-[130px] aspect-square rounded-2xl bg-[#0e71eb] text-white shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer"
        >
          <PlusIcon className="w-9 h-9 sm:w-11 sm:h-11 mb-1 stroke-[2.5] drop-shadow" />
        </button>
        <span className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
          Join
        </span>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={onScheduleMeeting}
          className="w-full max-w-[130px] aspect-square rounded-2xl bg-[#0e71eb]/90 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer"
        >
          <CalendarIcon className="w-9 h-9 sm:w-11 sm:h-11 mb-1 drop-shadow" />
        </button>
        <span className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
          Schedule
        </span>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={onShareScreen}
          className="w-full max-w-[130px] aspect-square rounded-2xl bg-[#0e71eb]/80 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer"
        >
          <ShareScreenIcon className="w-9 h-9 sm:w-11 sm:h-11 mb-1 drop-shadow" />
        </button>
        <span className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
          Share Screen
        </span>
      </div>

    </div>
  );
}
