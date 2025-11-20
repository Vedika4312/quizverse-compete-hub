import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SignalingMessage } from '@/types/webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface UseWebRTCSignalingProps {
  sessionId: string;
  userId: string;
  role: 'interviewer' | 'candidate';
  localStream: MediaStream | null;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export const useWebRTCSignaling = ({
  sessionId,
  userId,
  role,
  localStream,
  onRemoteStream,
  onConnectionStateChange,
}: UseWebRTCSignalingProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(role === 'candidate'); // Candidate is polite peer

  const sendSignal = useCallback(async (type: string, payload: any) => {
    if (!channelRef.current) return;
    
    const message: SignalingMessage = {
      type: type as any,
      payload,
      from: userId,
      role,
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: type,
      payload: message,
    });
  }, [userId, role]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      onConnectionStateChange(pc.connectionState);
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        sendSignal('offer', pc.localDescription);
      } catch (error) {
        console.error('Error in negotiation:', error);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }, [sendSignal, onRemoteStream, onConnectionStateChange]);

  useEffect(() => {
    if (!localStream) return;

    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    const channel = supabase.channel(`interview-signaling-${sessionId}`);

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }: { payload: SignalingMessage }) => {
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          const offerCollision = 
            (payload.type === 'offer') &&
            (makingOfferRef.current || pc.signalingState !== 'stable');

          const ignoreOffer = !politeRef.current && offerCollision;
          if (ignoreOffer) return;

          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('answer', pc.localDescription);
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: { payload: SignalingMessage }) => {
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: { payload: SignalingMessage }) => {
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.payload));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      pc.close();
    };
  }, [sessionId, userId, localStream, createPeerConnection, sendSignal]);

  return { peerConnection: peerConnectionRef.current };
};
