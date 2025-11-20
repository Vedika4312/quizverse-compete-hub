import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SignalingMessage } from '@/types/webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN servers for NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
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
  const [isChannelReady, setIsChannelReady] = useState(false);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  const offerCreatedRef = useRef(false);

  const sendSignal = useCallback(async (type: string, payload: any) => {
    if (!channelRef.current) {
      console.log('Channel not ready, cannot send signal:', type);
      return;
    }

    const message: SignalingMessage = {
      type: type as any,
      payload,
      from: userId,
      role,
    };

    console.log('Sending signal:', message);

    await channelRef.current.send({
      type: 'broadcast',
      event: type,
      payload: message,
    });
  }, [userId, role]);

  const createPeerConnection = useCallback(() => {
    console.log('Creating peer connection');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate;
        // Log candidate type to verify TURN usage
        const candidateType = candidate.candidate.includes('typ relay') ? 'TURN (relay)' :
                             candidate.candidate.includes('typ srflx') ? 'STUN (server reflexive)' :
                             candidate.candidate.includes('typ host') ? 'Host (local)' :
                             'Unknown';
        
        console.log(`🔵 ICE Candidate [${candidateType}]:`, candidate.candidate);
        sendSignal('ice-candidate', candidate.toJSON());
      } else {
        console.log('✅ ICE gathering complete');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState);
      
      // Log the selected candidate pair when connected
      if (pc.iceConnectionState === 'connected') {
        pc.getStats(null).then(stats => {
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              console.log('✅ Connected using candidate pair:', report);
              
              // Get local and remote candidates
              stats.forEach(stat => {
                if (stat.id === report.localCandidateId) {
                  const localType = stat.candidateType === 'relay' ? '🔄 TURN' :
                                  stat.candidateType === 'srflx' ? '🌐 STUN' :
                                  '🏠 Direct';
                  console.log(`Local candidate: ${localType} (${stat.candidateType})`, stat);
                }
                if (stat.id === report.remoteCandidateId) {
                  const remoteType = stat.candidateType === 'relay' ? '🔄 TURN' :
                                   stat.candidateType === 'srflx' ? '🌐 STUN' :
                                   '🏠 Direct';
                  console.log(`Remote candidate: ${remoteType} (${stat.candidateType})`, stat);
                }
              });
            }
          });
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('Signaling state:', pc.signalingState);
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams.length);
      if (event.streams && event.streams[0]) {
        console.log('Setting remote stream');
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      onConnectionStateChange(pc.connectionState);

      if (pc.connectionState === 'failed') {
        console.error('Connection failed, attempting restart');
        pc.restartIce();
      }
    };

    return pc;
  }, [sendSignal, onRemoteStream, onConnectionStateChange]);

  const processIceCandidatesQueue = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    console.log('Processing queued ICE candidates:', iceCandidatesQueue.current.length);

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
          console.log('Added queued ICE candidate');
        } catch (error) {
          console.error('Error adding queued ICE candidate:', error);
        }
      }
    }
  }, []);

  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !isChannelReady) {
      console.log('Not ready to create offer');
      return;
    }

    if (offerCreatedRef.current) {
      console.log('Offer already created, skipping');
      return;
    }

    try {
      console.log('Creating offer...');
      offerCreatedRef.current = true;
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);
      console.log('Local description set, sending offer');

      await sendSignal('offer', {
        type: offer.type,
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      offerCreatedRef.current = false;
    }
  }, [isChannelReady, sendSignal]);

  useEffect(() => {
    if (!localStream) {
      console.log('No local stream yet');
      return;
    }

    console.log('Initializing WebRTC connection as', role);

    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    console.log('Adding local tracks:', localStream.getTracks().length);
    localStream.getTracks().forEach((track) => {
      console.log('Adding track:', track.kind, track.enabled);
      pc.addTrack(track, localStream);
    });

    const channel = supabase.channel(`interview-signaling-${sessionId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }: { payload: SignalingMessage }) => {
        console.log('Received offer message:', payload);
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          console.log('Remote description set from offer, creating answer');

          await processIceCandidatesQueue();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('Local description set from answer, sending');

          await sendSignal('answer', {
            type: answer.type,
            sdp: answer.sdp,
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: { payload: SignalingMessage }) => {
        console.log('Received answer message:', payload);
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          console.log('Remote description set from answer');

          await processIceCandidatesQueue();
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: { payload: SignalingMessage }) => {
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          const candidate = new RTCIceCandidate(payload.payload);

          if (!pc.remoteDescription) {
            console.log('Queueing ICE candidate (no remote description yet)');
            iceCandidatesQueue.current.push(candidate);
          } else {
            console.log('Adding ICE candidate');
            await pc.addIceCandidate(candidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      })
      .subscribe(async (status) => {
        console.log('Channel subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsChannelReady(true);
          console.log('Channel ready');

          // Interviewer creates offer immediately when channel is ready
          if (role === 'interviewer') {
            console.log('Interviewer: creating offer immediately');
            setTimeout(() => createOffer(), 100); // Small delay to ensure state updates
          } else {
            console.log('Candidate: waiting for offer');
          }
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up WebRTC connection');
      // Reset offer state and ICE queue so a fresh connection can be established
      offerCreatedRef.current = false;
      iceCandidatesQueue.current = [];
      setIsChannelReady(false);
      
      channel.unsubscribe();
      pc.close();
    };
  }, [sessionId, userId, role, localStream, createPeerConnection, sendSignal, createOffer, processIceCandidatesQueue]);

  return { peerConnection: peerConnectionRef.current };
};
