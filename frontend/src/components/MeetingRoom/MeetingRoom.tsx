'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
  ShareScreenIcon,
  StopScreenIcon,
  UsersIcon,
  ChatIcon,
  SmileIcon,
  ShieldIcon,
  WhiteboardIcon,
  GridIcon,
  MaximizeIcon,
  MinimizeIcon,
  XIcon,
  HandIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  UserXIcon
} from '@/components/Icons';
import { Meeting, Participant, ChatMessage, ReactionItem } from '@/types';
import { getWebSocketUrl, getMeetingMessages } from '@/lib/api';
import Whiteboard from './Whiteboard';

interface MeetingRoomProps {
  meeting: Meeting;
  initialUserName: string;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
}

export default function MeetingRoom({
  meeting,
  initialUserName,
  initialAudioEnabled = true,
  initialVideoEnabled = true
}: MeetingRoomProps) {
  const router = useRouter();

  const [isAudioMuted, setIsAudioMuted] = useState(!initialAudioEnabled);
  const [isVideoOff, setIsVideoOff] = useState(!initialVideoEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<'none' | 'participants' | 'chat'>('none');
  const [showSecurityMenu, setShowSecurityMenu] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [meetingTimer, setMeetingTimer] = useState('00:00');
  const [copiedShieldLink, setCopiedShieldLink] = useState(false);

  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const clientIdRef = useRef<string>(
    'client_' + Math.random().toString(36).substring(2, 10)
  );

  const isHost = meeting.host?.name === initialUserName || initialUserName === 'Alex Morgan';

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      setMeetingTimer(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function setupLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getAudioTracks().forEach(track => {
          track.enabled = !isAudioMuted;
        });
        stream.getVideoTracks().forEach(track => {
          track.enabled = !isVideoOff;
        });

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const buffer = new Uint8Array(analyser.frequencyBinCount);
            const checkAudio = () => {
              if (analyser && !isAudioMuted) {
                analyser.getByteFrequencyData(buffer);
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) sum += buffer[i];
                const avg = sum / buffer.length;
                setAudioLevel(avg);
              } else {
                setAudioLevel(0);
              }
              requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        } catch (e) {
          // Audio analyzer fallback
        }
      } catch (err) {
        console.warn('Media access error / simulated devices', err);
      }
    }

    setupLocalMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isAudioMuted;
      });
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'media_state_change',
        is_muted: isAudioMuted,
        is_camera_off: isVideoOff,
        is_screen_sharing: isScreenSharing
      }));
    }
  }, [isAudioMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'media_state_change',
        is_muted: isAudioMuted,
        is_camera_off: isVideoOff,
        is_screen_sharing: isScreenSharing
      }));
    }
  }, [isVideoOff]);

  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const defaultParticipants: Participant[] = [
      {
        client_id: clientIdRef.current,
        user_id: clientIdRef.current,
        user_name: initialUserName,
        role: isHost ? 'host' : 'participant',
        is_muted: isAudioMuted,
        is_camera_off: isVideoOff,
        is_screen_sharing: false,
        raised_hand: false
      },
      {
        client_id: 'guest_sarah_chen',
        user_id: 'usr_sarah',
        user_name: 'Sarah Chen',
        role: 'participant',
        is_muted: false,
        is_camera_off: false,
        is_screen_sharing: false,
        raised_hand: false
      },
      {
        client_id: 'guest_david_miller',
        user_id: 'usr_david',
        user_name: 'David Miller',
        role: 'participant',
        is_muted: true,
        is_camera_off: true,
        is_screen_sharing: false,
        raised_hand: false
      }
    ];

    setParticipants(defaultParticipants);

    try {
      const bc = new BroadcastChannel(`zoom_room_${meeting.id}`);
      bcRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data || data.sender_client_id === clientIdRef.current) return;

        if (data.type === 'chat_message') {
          setChatMessages(prev => [...prev, data.message]);
          if (sidebarTab !== 'chat') setUnreadChatCount(prev => prev + 1);
        } else if (data.type === 'reaction_received') {
          const reactionId = Math.random().toString();
          setReactions(prev => [
            ...prev,
            { id: reactionId, user_name: data.user_name, emoji: data.emoji }
          ]);
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== reactionId));
          }, 3500);
        } else if (data.type === 'hand_state_updated') {
          setParticipants(prev =>
            prev.map(p =>
              p.client_id === data.client_id ? { ...p, raised_hand: data.raised_hand } : p
            )
          );
        } else if (data.type === 'force_mute_all') {
          if (!isHost) setIsAudioMuted(true);
        } else if (data.type === 'meeting_ended_by_host') {
          alert('The host has ended this meeting.');
          router.push('/');
        }
      };
    } catch (e) {}

    const wsUrl = getWebSocketUrl(
      meeting.id,
      clientIdRef.current,
      initialUserName,
      isHost ? 'host' : 'participant',
      isAudioMuted,
      isVideoOff
    );

    if (wsUrl) {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          getMeetingMessages(meeting.id).then(msgs => {
            if (msgs && msgs.length > 0) setChatMessages(msgs);
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'room_state' || data.type === 'user_joined' || data.type === 'user_left') {
              if (data.participants && data.participants.length > 0) {
                setParticipants(data.participants);
              }
            } else if (data.type === 'chat_message') {
              setChatMessages(prev => [...prev, data.message]);
              if (sidebarTab !== 'chat') setUnreadChatCount(prev => prev + 1);
            } else if (data.type === 'reaction_received') {
              const reactionId = Math.random().toString();
              setReactions(prev => [
                ...prev,
                { id: reactionId, user_name: data.user_name, emoji: data.emoji }
              ]);
              setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== reactionId));
              }, 3500);
            } else if (data.type === 'hand_state_updated') {
              setParticipants(prev =>
                prev.map(p =>
                  p.client_id === data.client_id ? { ...p, raised_hand: data.raised_hand } : p
                )
              );
            } else if (data.type === 'participant_media_updated') {
              setParticipants(prev =>
                prev.map(p =>
                  p.client_id === data.client_id
                    ? {
                        ...p,
                        is_muted: data.is_muted,
                        is_camera_off: data.is_camera_off,
                        is_screen_sharing: data.is_screen_sharing
                      }
                    : p
                )
              );
            } else if (data.type === 'force_mute' || data.type === 'force_mute_all') {
              setIsAudioMuted(true);
            } else if (data.type === 'kicked_from_meeting') {
              alert('You have been removed from the meeting by the host.');
              router.push('/');
            } else if (data.type === 'meeting_ended_by_host') {
              alert('The host has ended this meeting for all participants.');
              router.push('/');
            }
          } catch (err) {}
        };
      } catch (err) {}
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (bcRef.current) {
        bcRef.current.close();
      }
    };
  }, [meeting.id]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'media_state_change',
          is_muted: isAudioMuted,
          is_camera_off: isVideoOff,
          is_screen_sharing: false
        }));
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = stream;
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media_state_change',
            is_muted: isAudioMuted,
            is_camera_off: isVideoOff,
            is_screen_sharing: true
          }));
        }
      } catch (err) {
        console.warn('Screen share canceled or denied', err);
      }
    }
  };

  const sendReaction = (emoji: string) => {
    const payload = {
      type: 'reaction',
      emoji,
      sender_client_id: clientIdRef.current,
      user_name: initialUserName
    };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'reaction_received',
        emoji,
        sender_client_id: clientIdRef.current,
        user_name: initialUserName
      });
    }
    const reactionId = Math.random().toString();
    setReactions(prev => [
      ...prev,
      { id: reactionId, user_name: initialUserName, emoji }
    ]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 3500);
    setShowReactionsMenu(false);
  };

  const toggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'toggle_hand'
      }));
    }
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'hand_state_updated',
        client_id: clientIdRef.current,
        raised_hand: nextState,
        sender_client_id: clientIdRef.current
      });
    }
    setShowReactionsMenu(false);
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender_name: initialUserName,
      sender_id: clientIdRef.current,
      text: chatInput.trim(),
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        text: chatInput.trim()
      }));
    }
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'chat_message',
        message: newMsg,
        sender_client_id: clientIdRef.current
      });
    }
    setChatInput('');
  };

  const hostMuteAll = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'host_control',
        action: 'mute_all'
      }));
    }
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'force_mute_all',
        sender_client_id: clientIdRef.current
      });
    }
    setParticipants(prev =>
      prev.map(p => (p.client_id !== clientIdRef.current ? { ...p, is_muted: true } : p))
    );
  };

  const hostMuteParticipant = (targetClientId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'host_control',
        action: 'mute_participant',
        target_client_id: targetClientId
      }));
    }
  };

  const hostRemoveParticipant = (targetClientId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'host_control',
        action: 'remove_participant',
        target_client_id: targetClientId
      }));
    }
  };

  const hostEndMeetingForAll = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'host_control',
        action: 'end_meeting_for_all'
      }));
    }
    router.push('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.user_name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#18181b] text-white select-none overflow-hidden font-sans">
      
      <div className="h-11 bg-[#121214] border-b border-gray-800/80 px-4 flex items-center justify-between z-30 shrink-0">
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSecurityMenu(!showSecurityMenu)}
              className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/60 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ShieldIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Encrypted</span>
            </button>

            {showSecurityMenu && (
              <div
                className="absolute left-0 mt-2 w-80 bg-[#242731] border border-gray-700 rounded-xl shadow-2xl p-4 z-50 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldIcon className="w-4 h-4" />
                    Zoom Enhanced Encryption
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Audio, video, and screen sharing are securely encrypted end-to-end.
                  </p>
                </div>

                <div className="py-3 space-y-2 font-mono text-gray-300">
                  <div>
                    <span className="text-gray-500">Meeting ID: </span>
                    <span className="text-white font-medium">{meeting.meeting_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Host: </span>
                    <span className="text-white font-medium">{meeting.host?.name || 'Alex Morgan'}</span>
                  </div>
                  {meeting.passcode && (
                    <div>
                      <span className="text-gray-500">Passcode: </span>
                      <span className="text-white font-medium">{meeting.passcode}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/meeting/${meeting.meeting_number}`;
                    navigator.clipboard.writeText(url);
                    setCopiedShieldLink(true);
                    setTimeout(() => setCopiedShieldLink(false), 2000);
                  }}
                  className="w-full py-2 bg-[#0e71eb] hover:bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  {copiedShieldLink ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  {copiedShieldLink ? 'Link Copied!' : 'Copy Invite Link'}
                </button>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-200 truncate max-w-xs">
              {meeting.topic}
            </span>
            <span className="text-[11px] font-mono text-gray-400 px-2 py-0.5 rounded bg-gray-800">
              {meetingTimer}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
            className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
          >
            <GridIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{viewMode === 'gallery' ? 'Speaker View' : 'Gallery View'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-xs transition"
            title="Fullscreen"
          >
            {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5" /> : <MaximizeIcon className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 overflow-y-auto relative bg-[#09090b]">
          
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700 shadow-2xl flex items-center gap-2 animate-bounce"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-xs font-bold text-white">{r.user_name}</span>
              </div>
            ))}
          </div>

          {isScreenSharing && (
            <div className="w-full h-full max-h-[78vh] bg-black rounded-2xl border border-blue-500/40 overflow-hidden relative flex items-center justify-center shadow-2xl mb-3">
              <video
                ref={screenShareVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow">
                <ShareScreenIcon className="w-3.5 h-3.5" />
                You are sharing your screen
              </div>
            </div>
          )}

          <Whiteboard
            isOpen={showWhiteboard}
            onClose={() => setShowWhiteboard(false)}
            broadcastChannel={bcRef.current}
            ws={wsRef.current}
          />

          <div
            className={`w-full h-full grid gap-4 place-content-center items-center justify-center ${
              participants.length <= 1
                ? 'grid-cols-1 max-w-4xl max-h-[650px]'
                : participants.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                : participants.length <= 4
                ? 'grid-cols-2 max-w-5xl'
                : 'grid-cols-2 md:grid-cols-3 max-w-6xl'
            }`}
          >
            
            <div
              className={`relative aspect-video w-full rounded-2xl bg-[#1e2026] border overflow-hidden shadow-xl flex items-center justify-center transition-all ${
                audioLevel > 15 ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-gray-800'
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
              />

              {isVideoOff && (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#0e71eb] text-white text-2xl font-bold flex items-center justify-center shadow-lg border-2 border-blue-400/40">
                    {initialUserName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-300 mt-2">
                    {initialUserName} (You)
                  </span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow border border-white/10">
                {isAudioMuted ? (
                  <MicOffIcon className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <MicIcon className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{initialUserName} (You{isHost ? ' - Host' : ''})</span>
              </div>

              {isHandRaised && (
                <div className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
                  <HandIcon className="w-4 h-4" />
                  Hand Raised
                </div>
              )}
            </div>

            {participants
              .filter(p => p.client_id !== clientIdRef.current)
              .map((participant) => (
                <div
                  key={participant.client_id}
                  className="relative aspect-video w-full rounded-2xl bg-[#1e2026] border border-gray-800 overflow-hidden shadow-xl flex items-center justify-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-700 text-white text-2xl font-bold flex items-center justify-center shadow-lg border-2 border-gray-600">
                      {participant.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-300 mt-2">
                      {participant.user_name}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow border border-white/10">
                    {participant.is_muted ? (
                      <MicOffIcon className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <MicIcon className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{participant.user_name}</span>
                  </div>

                  {participant.raised_hand && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                      <HandIcon className="w-4 h-4" />
                      Hand Raised
                    </div>
                  )}

                  {isHost && (
                    <div className="absolute top-3 left-3 opacity-0 hover:opacity-100 transition flex items-center gap-1">
                      <button
                        onClick={() => hostMuteParticipant(participant.client_id)}
                        title="Mute participant"
                        className="p-1.5 bg-black/80 hover:bg-rose-950 text-white rounded-md text-xs border border-gray-700"
                      >
                        <MicOffIcon className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                      <button
                        onClick={() => hostRemoveParticipant(participant.client_id)}
                        title="Remove participant"
                        className="p-1.5 bg-black/80 hover:bg-rose-950 text-white rounded-md text-xs border border-gray-700"
                      >
                        <UserXIcon className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

          </div>
        </div>

        {sidebarTab === 'participants' && (
          <aside className="w-80 bg-[#1e212b] border-l border-gray-800 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-150">
            <div className="p-4 border-b border-gray-700/80 flex items-center justify-between bg-[#191b24]">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Participants ({participants.length || 1})
                </h3>
              </div>
              <button
                onClick={() => setSidebarTab('none')}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-800">
              <input
                type="text"
                placeholder="Search participants..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-[#13151b] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-gray-800/60">
              <div className="p-2 flex items-center justify-between hover:bg-[#282c38] rounded-xl transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#0e71eb] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initialUserName[0]?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {initialUserName} (Me)
                    </p>
                    <span className="text-[10px] text-blue-400">
                      {isHost ? 'Host' : 'Participant'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isHandRaised && <HandIcon className="w-3.5 h-3.5 text-amber-400" />}
                  {isAudioMuted ? <MicOffIcon className="w-3.5 h-3.5 text-rose-400" /> : <MicIcon className="w-3.5 h-3.5 text-emerald-400" />}
                  {isVideoOff ? <VideoOffIcon className="w-3.5 h-3.5 text-rose-400" /> : <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </div>

              {filteredParticipants
                .filter(p => p.client_id !== clientIdRef.current)
                .map((p) => (
                  <div
                    key={p.client_id}
                    className="p-2 flex items-center justify-between hover:bg-[#282c38] rounded-xl transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {p.user_name[0]?.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">
                          {p.user_name}
                        </p>
                        <span className="text-[10px] text-gray-400 capitalize">
                          {p.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.raised_hand && <HandIcon className="w-3.5 h-3.5 text-amber-400" />}
                      {p.is_muted ? <MicOffIcon className="w-3.5 h-3.5 text-rose-400" /> : <MicIcon className="w-3.5 h-3.5 text-emerald-400" />}
                      {p.is_camera_off ? <VideoOffIcon className="w-3.5 h-3.5 text-rose-400" /> : <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />}
                      
                      {isHost && (
                        <button
                          onClick={() => hostRemoveParticipant(p.client_id)}
                          title="Remove participant"
                          className="p-1 hover:bg-rose-900/60 rounded text-gray-400 hover:text-rose-400"
                        >
                          <UserXIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {isHost && (
              <div className="p-3 border-t border-gray-800 bg-[#161820] flex gap-2">
                <button
                  onClick={hostMuteAll}
                  className="flex-1 py-1.5 bg-[#2d323f] hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Mute All
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/meeting/${meeting.meeting_number}`;
                    navigator.clipboard.writeText(url);
                    alert('Meeting invite link copied!');
                  }}
                  className="px-3 py-1.5 bg-[#0e71eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Invite
                </button>
              </div>
            )}
          </aside>
        )}

        {sidebarTab === 'chat' && (
          <aside className="w-80 bg-[#1e212b] border-l border-gray-800 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-150">
            <div className="p-4 border-b border-gray-700/80 flex items-center justify-between bg-[#191b24]">
              <div className="flex items-center gap-2">
                <ChatIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Meeting Chat</h3>
              </div>
              <button
                onClick={() => setSidebarTab('none')}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-1.5 bg-[#14161d] border-b border-gray-800 text-[11px] text-gray-400 flex items-center gap-2">
              <span>To:</span>
              <span className="font-semibold text-blue-400">Everyone</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center">
                  <ChatIcon className="w-8 h-8 mb-2 opacity-50" />
                  No messages yet. Say hello to everyone!
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.sender_name === initialUserName;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5">
                        <span className="font-semibold text-gray-300">{msg.sender_name}</span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                          isMe ? 'bg-[#0e71eb] text-white rounded-br-none' : 'bg-[#292d3a] text-gray-100 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-800 bg-[#161820]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type message here..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-[#121318] border border-gray-700 rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0e71eb]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-1.5 p-1.5 text-blue-400 hover:text-white disabled:opacity-30 transition"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </aside>
        )}

      </div>

      <footer className="h-16 bg-[#121214] border-t border-gray-800/80 px-4 flex items-center justify-between z-30 shrink-0 select-none">
        
        <div className="flex items-center gap-1 sm:gap-2">
          
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[58px] ${
              isAudioMuted ? 'text-rose-400 hover:bg-rose-950/40' : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            {isAudioMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-0.5">
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[58px] ${
              isVideoOff ? 'text-rose-400 hover:bg-rose-950/40' : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            {isVideoOff ? <VideoOffIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-0.5">
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </span>
          </button>

        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          
          <button
            onClick={() => {
              setSidebarTab(sidebarTab === 'participants' ? 'none' : 'participants');
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[58px] relative ${
              sidebarTab === 'participants' ? 'bg-[#0e71eb] text-white' : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Participants</span>
            <span className="absolute top-1 right-2 text-[9px] font-bold bg-blue-500 text-white rounded-full px-1">
              {participants.length || 1}
            </span>
          </button>

          <button
            onClick={() => {
              setSidebarTab(sidebarTab === 'chat' ? 'none' : 'chat');
              setUnreadChatCount(0);
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[58px] relative ${
              sidebarTab === 'chat' ? 'bg-[#0e71eb] text-white' : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <ChatIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-2 text-[9px] font-bold bg-rose-500 text-white rounded-full px-1 animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[62px] ${
              isScreenSharing
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            {isScreenSharing ? <StopScreenIcon className="w-5 h-5" /> : <ShareScreenIcon className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-0.5">
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </span>
          </button>

          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`hidden sm:flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[58px] ${
              showWhiteboard ? 'bg-[#0e71eb] text-white' : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <WhiteboardIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Whiteboard</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowReactionsMenu(!showReactionsMenu)}
              className="flex flex-col items-center justify-center p-2 rounded-xl text-gray-200 hover:bg-gray-800 transition min-w-[58px]"
            >
              <SmileIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Reactions</span>
            </button>

            {showReactionsMenu && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#242731] border border-gray-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 pb-2">
                  {['👏', '👍', '❤️', '😂', '😮', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="text-xl p-1.5 hover:scale-125 transition rounded-lg hover:bg-gray-700"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleHand}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isHandRaised
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#2f3545] hover:bg-[#3d4559] text-white'
                  }`}
                >
                  <HandIcon className="w-4 h-4" />
                  {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                </button>
              </div>
            )}
          </div>

        </div>

        <div>
          <button
            onClick={() => setShowEndDialog(true)}
            className="px-4 py-2 bg-[#e02828] hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            {isHost ? 'End' : 'Leave'}
          </button>
        </div>

      </footer>

      {showEndDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#242731] border border-gray-700 rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">
              {isHost ? 'End Meeting for All?' : 'Leave Meeting?'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              {isHost
                ? 'You can choose to end the meeting for all participants or simply leave the room.'
                : 'Are you sure you want to leave this session?'}
            </p>

            <div className="space-y-2">
              {isHost && (
                <button
                  onClick={hostEndMeetingForAll}
                  className="w-full py-2.5 bg-[#e02828] hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  End Meeting for All
                </button>
              )}

              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 bg-[#2d323f] hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition"
              >
                Leave Meeting
              </button>

              <button
                onClick={() => setShowEndDialog(false)}
                className="w-full py-2 text-gray-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
