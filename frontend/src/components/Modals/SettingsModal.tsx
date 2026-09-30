'use client';

import React, { useState } from 'react';
import { XIcon, VideoIcon, MicIcon, ShieldIcon, SettingsIcon } from '@/components/Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'general'>('video');
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState('auto');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl bg-[#242731] border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden flex flex-col md:flex-row min-h-[420px] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-56 bg-[#1e212b] border-r border-gray-700/60 p-4 space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Settings
          </div>

          <button
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'video'
                ? 'bg-[#0e71eb] text-white'
                : 'text-gray-300 hover:bg-[#282d3b]'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            Video
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'audio'
                ? 'bg-[#0e71eb] text-white'
                : 'text-gray-300 hover:bg-[#282d3b]'
            }`}
          >
            <MicIcon className="w-4 h-4" />
            Audio
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'general'
                ? 'bg-[#0e71eb] text-white'
                : 'text-gray-300 hover:bg-[#282d3b]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            General
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/60">
              <h3 className="text-base font-bold text-white capitalize">
                {activeTab} Settings
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1.5">Camera Source</label>
                    <select className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-white">
                      <option>Integrated HD Webcam (Default)</option>
                      <option>External USB Camera</option>
                      <option>Virtual Video Source</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={hdVideo}
                        onChange={(e) => setHdVideo(e.target.checked)}
                        className="rounded border-gray-600 text-[#0e71eb] accent-[#0e71eb] w-4 h-4"
                      />
                      <span>Enable HD video rendering</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={mirrorVideo}
                        onChange={(e) => setMirrorVideo(e.target.checked)}
                        className="rounded border-gray-600 text-[#0e71eb] accent-[#0e71eb] w-4 h-4"
                      />
                      <span>Mirror my video</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1.5">Microphone</label>
                    <select className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-white">
                      <option>Built-in Microphone Array</option>
                      <option>Headset Microphone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1.5">Background Noise Suppression</label>
                    <select
                      value={noiseSuppression}
                      onChange={(e) => setNoiseSuppression(e.target.value)}
                      className="w-full bg-[#1b1d24] border border-gray-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="auto">Auto (Recommended)</option>
                      <option value="low">Low (Faint background sounds)</option>
                      <option value="medium">Medium (Computer fan, pen taps)</option>
                      <option value="high">High (Typing, barking dog)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-blue-200">
                    Zoom Workplace is optimized with hardware acceleration enabled.
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-600 text-[#0e71eb] accent-[#0e71eb] w-4 h-4"
                    />
                    <span>Ask for confirmation when leaving a meeting</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-600 text-[#0e71eb] accent-[#0e71eb] w-4 h-4"
                    />
                    <span>Show meeting duration timer</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0e71eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
