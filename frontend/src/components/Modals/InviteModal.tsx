'use client';

import React, { useState } from 'react';
import { XIcon, CopyIcon, CheckIcon, ShieldIcon } from '@/components/Icons';
import { Meeting } from '@/types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

export default function InviteModal({ isOpen, onClose, meeting }: InviteModalProps) {
  const [copiedType, setCopiedType] = useState<'link' | 'full' | null>(null);

  if (!isOpen || !meeting) return null;

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/meeting/${meeting.meeting_number}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyInvitation = () => {
    const text = `Topic: ${meeting.topic}\nJoin Zoom Meeting: ${joinUrl}\n\nMeeting ID: ${meeting.meeting_number}\nPasscode: ${meeting.passcode || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopiedType('full');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-[#242731] border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-[#1e212b]">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Invite Participants</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 font-semibold uppercase tracking-wider mb-1">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#0e71eb] hover:bg-blue-600 text-white font-semibold rounded-xl transition shrink-0 flex items-center gap-1.5"
              >
                {copiedType === 'link' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                {copiedType === 'link' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#1b1d24] border border-gray-700/60 rounded-xl space-y-1.5 font-mono text-gray-300">
            <div>
              <span className="text-gray-500">Meeting ID: </span>
              <span className="text-white font-semibold">{meeting.meeting_number}</span>
            </div>
            {meeting.passcode && (
              <div>
                <span className="text-gray-500">Passcode: </span>
                <span className="text-white font-semibold">{meeting.passcode}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleCopyInvitation}
              className="w-full py-2.5 bg-[#2d323f] hover:bg-[#383e4d] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {copiedType === 'full' ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
              {copiedType === 'full' ? 'Invitation Copied to Clipboard!' : 'Copy Full Meeting Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
