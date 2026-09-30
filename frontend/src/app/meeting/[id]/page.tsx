'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMeetingDetails } from '@/lib/api';
import { Meeting } from '@/types';
import MeetingRoom from '@/components/MeetingRoom/MeetingRoom';
import { VideoIcon, VideoOffIcon, MicIcon, MicOffIcon, ArrowRightIcon } from '@/components/Icons';

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryName = searchParams.get('name');
  const queryAudio = searchParams.get('audio') !== 'false';
  const queryVideo = searchParams.get('video') !== 'false';

  const [displayName, setDisplayName] = useState(queryName || '');
  const [audioEnabled, setAudioEnabled] = useState(queryAudio);
  const [videoEnabled, setVideoEnabled] = useState(queryVideo);
  const [isJoined, setIsJoined] = useState(!!queryName);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMeetingDetails(resolvedParams.id);
        setMeeting(data);
      } catch (err: any) {
        setError('Meeting not found or has ended.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#0e71eb] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-300">Connecting to Zoom session...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center text-white p-4">
        <div className="w-full max-w-md bg-[#242731] border border-gray-700 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <VideoOffIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Meeting Unavailable</h2>
          <p className="text-xs text-gray-400 mb-6">{error || 'This meeting ID is invalid.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-[#0e71eb] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center text-white p-4">
        <div className="w-full max-w-lg bg-[#242731] border border-gray-700 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="text-center pb-6 border-b border-gray-700/80">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Zoom Meeting Room
            </span>
            <h1 className="text-xl font-bold text-white mt-1">{meeting.topic}</h1>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Meeting ID: {meeting.meeting_number.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
            </p>
          </div>

          <div className="my-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                  audioEnabled
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                }`}
              >
                {audioEnabled ? <MicIcon className="w-4 h-4" /> : <MicOffIcon className="w-4 h-4" />}
                {audioEnabled ? 'Mic Unmuted' : 'Mic Muted'}
              </button>

              <button
                type="button"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                  videoEnabled
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                }`}
              >
                {videoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOffIcon className="w-4 h-4" />}
                {videoEnabled ? 'Camera On' : 'Camera Off'}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (!displayName.trim()) {
                alert('Please enter your display name to join.');
                return;
              }
              setIsJoined(true);
            }}
            className="w-full py-3 bg-[#0e71eb] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            Join Meeting
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <MeetingRoom
      meeting={meeting}
      initialUserName={displayName || 'Alex Morgan'}
      initialAudioEnabled={audioEnabled}
      initialVideoEnabled={videoEnabled}
    />
  );
}
