import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { InterviewParticipant } from '@/types/webrtc';

export const useInterviewPresence = (sessionId: string, userId: string, role: 'interviewer' | 'candidate') => {
  const [participants, setParticipants] = useState<InterviewParticipant[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const presenceChannel = supabase.channel(`interview-presence-${sessionId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const allParticipants: InterviewParticipant[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            allParticipants.push(presence as InterviewParticipant);
          });
        });
        
        setParticipants(allParticipants);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            role,
            joined_at: new Date().toISOString(),
            video_enabled: true,
            audio_enabled: true,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [sessionId, userId, role]);

  const updateMediaState = async (videoEnabled: boolean, audioEnabled: boolean) => {
    if (channel) {
      await channel.track({
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
        video_enabled: videoEnabled,
        audio_enabled: audioEnabled,
      });
    }
  };

  return { participants, updateMediaState };
};
