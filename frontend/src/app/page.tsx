'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ActionCards from '@/components/ActionCards';
import ClockCard from '@/components/ClockCard';
import UpcomingMeetingsList from '@/components/UpcomingMeetingsList';
import RecentMeetingsList from '@/components/RecentMeetingsList';
import JoinMeetingModal from '@/components/Modals/JoinMeetingModal';
import ScheduleMeetingModal from '@/components/Modals/ScheduleMeetingModal';
import SettingsModal from '@/components/Modals/SettingsModal';
import InviteModal from '@/components/Modals/InviteModal';
import { fetchDashboard, createInstantMeeting, deleteMeeting } from '@/lib/api';
import { Meeting, User } from '@/types';

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | undefined>(undefined);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedInviteMeeting, setSelectedInviteMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await fetchDashboard();
      setUser(data.user);
      setUpcomingMeetings(data.upcoming_meetings);
      setRecentMeetings(data.recent_meetings);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMeeting = async (withVideo: boolean) => {
    try {
      const meeting = await createInstantMeeting(
        `${user?.name || 'Alex Morgan'}'s Personal Meeting Room`,
        user?.name || 'Alex Morgan'
      );
      router.push(`/meeting/${meeting.meeting_number}?name=${encodeURIComponent(user?.name || 'Alex Morgan')}&video=${withVideo}&audio=true`);
    } catch (err) {
      alert('Failed to launch instant meeting. Please check backend connection.');
    }
  };

  const handleStartMeeting = (meeting: Meeting) => {
    router.push(`/meeting/${meeting.meeting_number}?name=${encodeURIComponent(user?.name || 'Alex Morgan')}&video=true&audio=true`);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to cancel this scheduled meeting?')) {
      try {
        await deleteMeeting(meetingId);
        setUpcomingMeetings(prev => prev.filter(m => m.id !== meetingId));
      } catch (err) {
        alert('Failed to delete meeting');
      }
    }
  };

  const handleScheduled = (newMeeting: Meeting) => {
    setUpcomingMeetings(prev => [newMeeting, ...prev]);
    setSelectedInviteMeeting(newMeeting);
  };

  const nextMeeting = upcomingMeetings[0];

  return (
    <div className="min-h-screen bg-[#131417] text-gray-100 flex flex-col font-sans">
      
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 xl:col-span-8 bg-[#1a1c22] border border-gray-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="mb-4">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Welcome back, {user?.name || 'Alex'}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Start, join, or schedule your collaboration sessions
                  </p>
                </div>

                <ActionCards
                  onNewMeeting={handleNewMeeting}
                  onJoinMeeting={() => setIsJoinModalOpen(true)}
                  onScheduleMeeting={() => setIsScheduleModalOpen(true)}
                  onShareScreen={() => setIsJoinModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <ClockCard
                  nextMeeting={nextMeeting}
                  onStartMeeting={handleStartMeeting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 xl:col-span-8">
                <UpcomingMeetingsList
                  meetings={upcomingMeetings}
                  onStartMeeting={handleStartMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <RecentMeetingsList
                  meetings={recentMeetings}
                  onStartMeeting={handleStartMeeting}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'team_chat' && (
          <div className="bg-[#1a1c22] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <h2 className="text-lg font-bold text-white mb-2">Team Chat Channels</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Channels, direct messages, and team threads are active in meeting rooms.
            </p>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <UpcomingMeetingsList
              meetings={upcomingMeetings}
              onStartMeeting={handleStartMeeting}
              onDeleteMeeting={handleDeleteMeeting}
            />
            <RecentMeetingsList
              meetings={recentMeetings}
              onStartMeeting={handleStartMeeting}
            />
          </div>
        )}

        {activeTab === 'whiteboards' && (
          <div className="bg-[#1a1c22] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <h2 className="text-lg font-bold text-white mb-2">Zoom Whiteboards</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Collaborative canvas whiteboards can be opened live within any meeting session.
            </p>
          </div>
        )}

        {activeTab === 'more' && (
          <div className="bg-[#1a1c22] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <h2 className="text-lg font-bold text-white mb-2">Zoom Workplace Suite</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Includes Zoom AI Companion, Notes, Clips, and App integrations.
            </p>
          </div>
        )}

      </main>

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        defaultUserName={user?.name || 'Alex Morgan'}
      />

      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduled={handleScheduled}
        hostName={user?.name || 'Alex Morgan'}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <InviteModal
        isOpen={!!selectedInviteMeeting}
        onClose={() => setSelectedInviteMeeting(null)}
        meeting={selectedInviteMeeting}
      />

    </div>
  );
}
