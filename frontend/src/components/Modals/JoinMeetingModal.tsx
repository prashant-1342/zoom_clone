'use client';

import React, { useState } from 'react';
import { XIcon } from '@/components/Icons';
import { validateMeeting } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserName?: string;
}

export default function JoinMeetingModal({
  isOpen,
  onClose,
  defaultUserName = 'Alex Morgan'
}: JoinMeetingModalProps) {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState('');
  const [displayName, setDisplayName] = useState(defaultUserName);
  const [passcode, setPasscode] = useState('');
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [needPasscode, setNeedPasscode] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingInput.trim()) {
      setErrorMsg('Please enter a Meeting ID or invite link.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    let parsedId = meetingInput.trim();
    if (parsedId.includes('/meeting/')) {
      parsedId = parsedId.split('/meeting/')[1].split('?')[0];
    }
    parsedId = parsedId.replace(/[^a-zA-Z0-9-]/g, '');

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await validateMeeting({
        meeting_identifier: parsedId,
        passcode: passcode || undefined,
        user_name: displayName.trim()
      });

      if (res.valid) {
        localStorage.setItem('zoom_user_name', displayName.trim());
        localStorage.setItem('zoom_no_audio', String(noAudio));
        localStorage.setItem('zoom_no_video', String(noVideo));

        onClose();
        router.push(`/meeting/${res.meeting_number || res.id}?name=${encodeURIComponent(displayName.trim())}&audio=${!noAudio}&video=${!noVideo}`);
      }
    } catch (err: any) {
      if (err.message?.includes('passcode')) {
        setNeedPasscode(true);
        setErrorMsg('Please enter the meeting passcode.');
      } else {
        setErrorMsg(err.message || 'Unable to join meeting. Please verify ID.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-[#242731] border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-[#1e212b]">
          <h3 className="text-base font-bold text-white tracking-tight">Join Meeting</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Meeting ID or Personal Link Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 842 910 3849"
              value={meetingInput}
              onChange={(e) => setMeetingInput(e.target.value)}
              className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] transition"
            />
          </div>

          {needPasscode && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Meeting Passcode
              </label>
              <input
                type="text"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] transition"
              />
            </div>
          )}

          <div className="pt-2 space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="checkbox"
                checked={noAudio}
                onChange={(e) => setNoAudio(e.target.checked)}
                className="rounded border-gray-600 text-[#0e71eb] focus:ring-0 w-4 h-4 accent-[#0e71eb]"
              />
              <span>Do not connect to audio</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="checkbox"
                checked={noVideo}
                onChange={(e) => setNoVideo(e.target.checked)}
                className="rounded border-gray-600 text-[#0e71eb] focus:ring-0 w-4 h-4 accent-[#0e71eb]"
              />
              <span>Turn off my video</span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[#0e71eb] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition"
            >
              {isLoading ? 'Verifying...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
