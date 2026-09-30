'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SearchIcon, SettingsIcon } from '@/components/Icons';
import { User } from '@/types';

interface NavbarProps {
  user?: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenSettings?: () => void;
}

export default function Navbar({
  user,
  activeTab = 'home',
  onTabChange,
  onOpenSettings
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'available' | 'busy' | 'away'>('available');

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'team_chat', label: 'Team Chat' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'whiteboards', label: 'Whiteboards' },
    { id: 'more', label: 'More' }
  ];

  return (
    <header className="w-full bg-[#1b1c20] text-gray-200 border-b border-gray-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#0e71eb] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:brightness-110 transition">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11ZM18.5 8.79l3.14-2.1a1 1 0 0 1 1.56.83v8.96a1 1 0 0 1-1.56.83l-3.14-2.1V8.79Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              zoom
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Workplace
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#2d313a] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#252830]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings, contacts, or chat..."
              className="w-full bg-[#292c34] text-sm text-gray-200 pl-9 pr-4 py-1.5 rounded-lg border border-gray-700/60 focus:outline-none focus:border-[#0e71eb] focus:ring-1 focus:ring-[#0e71eb] placeholder-gray-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252830] transition"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-blue-500/50 transition"
            >
              <div className="relative">
                <img
                  src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-full object-cover border border-gray-600"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1b1c20] ${
                    userStatus === 'available'
                      ? 'bg-emerald-500'
                      : userStatus === 'busy'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-[#242731] border border-gray-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-gray-700/60">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Alex Morgan'}</p>
                  <p className="text-xs text-gray-400">{user?.email || 'alex.morgan@zoomflow.internal'}</p>
                  <span className="inline-block mt-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Pro Account (Licensed)
                  </span>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </div>
                  <button
                    onClick={() => { setUserStatus('available'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-[#2e3340] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Available
                  </button>
                  <button
                    onClick={() => { setUserStatus('busy'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-[#2e3340] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Busy (Do Not Disturb)
                  </button>
                  <button
                    onClick={() => { setUserStatus('away'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-[#2e3340] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Away
                  </button>
                </div>

                <div className="border-t border-gray-700/60 mt-1 pt-1">
                  <button
                    onClick={() => { onOpenSettings?.(); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#2e3340]"
                  >
                    Settings
                  </button>
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Zoom Workplace Client v5.16
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
