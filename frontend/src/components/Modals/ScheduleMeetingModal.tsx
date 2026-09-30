'use client';

import React, { useState } from 'react';
import { XIcon, CalendarIcon } from '@/components/Icons';
import { scheduleMeeting } from '@/lib/api';
import { Meeting } from '@/types';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (meeting: Meeting) => void;
  hostName?: string;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onScheduled,
  hostName = 'Alex Morgan'
}: ScheduleMeetingModalProps) {
  const [topic, setTopic] = useState(`${hostName}'s Zoom Meeting`);
  const [description, setDescription] = useState('');
  
  const getTomorrowDefaultDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [startTime, setStartTime] = useState(getTomorrowDefaultDate());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passcode, setPasscode] = useState(
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [hostVideoOn, setHostVideoOn] = useState(true);
  const [participantVideoOn, setParticipantVideoOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please specify a meeting topic.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const scheduled = await scheduleMeeting({
        topic: topic.trim(),
        description: description.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: durationMinutes,
        passcode: passcode.trim() || undefined,
        host_name: hostName
      });

      onScheduled(scheduled);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#242731] border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-[#1e212b]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#0e71eb]" />
            <h3 className="text-base font-bold text-white tracking-tight">Schedule Meeting</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Topic
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Q4 Strategy Review"
              className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda, briefing notes, and links..."
              className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0e71eb] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0e71eb] transition"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-700/60 pt-3">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Security Passcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#0e71eb] transition"
              />
              <button
                type="button"
                onClick={() => setPasscode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl text-gray-300 transition"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="border-t border-gray-700/60 pt-3">
            <span className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Video Preferences
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={hostVideoOn}
                  onChange={(e) => setHostVideoOn(e.target.checked)}
                  className="rounded border-gray-600 text-[#0e71eb] focus:ring-0 w-4 h-4 accent-[#0e71eb]"
                />
                <span>Host video on</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={participantVideoOn}
                  onChange={(e) => setParticipantVideoOn(e.target.checked)}
                  className="rounded border-gray-600 text-[#0e71eb] focus:ring-0 w-4 h-4 accent-[#0e71eb]"
                />
                <span>Participants video on</span>
              </label>
            </div>
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
              {isLoading ? 'Saving...' : 'Save & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
