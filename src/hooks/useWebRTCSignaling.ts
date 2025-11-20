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
  const channelReadyRef = useRef(false);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  const offerCreatedRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const isInitializingRef = useRef(false);
  
  // Stabilize callbacks with refs to prevent effect re-runs
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  
  useEffect(() => {
    onRemoteStreamRef.current = onRemoteStream;
  }, [onRemoteStream]);
  
  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

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
    if (!pc || !channelReadyRef.current) {
      console.log('Not ready to create offer (PC or channel not ready)');
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
  }, [sendSignal]);

  useEffect(() => {
    if (!localStream) {
      console.log('No local stream yet');
      return;
    }

    // Prevent creating multiple peer connections with a guard flag
    if (peerConnectionRef.current || isInitializingRef.current) {
      console.log('Peer connection already exists or is initializing, skipping');
      return;
    }

    isInitializingRef.current = true;
    console.log('Initializing WebRTC connection as', role);

    // Create peer connection inline to avoid dependency issues
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate;
        const candidateType = candidate.candidate.includes('typ relay') ? 'TURN (relay)' :
                             candidate.candidate.includes('typ srflx') ? 'STUN (server reflexive)' :
                             candidate.candidate.includes('typ host') ? 'Host (local)' :
                             'Unknown';
        
        console.log(`🔵 ICE Candidate [${candidateType}]:`, candidate.candidate);
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              type: 'ice-candidate',
              payload: candidate.toJSON(),
              from: userId,
              role,
            },
          });
        }
      } else {
        console.log('✅ ICE gathering complete');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected') {
        pc.getStats(null).then(stats => {
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              console.log('✅ Connected using candidate pair:', report);
              
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
        onRemoteStreamRef.current(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      onConnectionStateChangeRef.current(pc.connectionState);

      if (pc.connectionState === 'failed') {
        console.error('Connection failed, attempting restart');
        pc.restartIce();
      }
    };

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

    // Helper to send signals
    const sendChannelSignal = async (type: string, payload: any) => {
      if (!channelRef.current) return;
      
      await channelRef.current.send({
        type: 'broadcast',
        event: type,
        payload: {
          type,
          payload,
          from: userId,
          role,
        },
      });
    };

    // Helper to process ICE candidate queue
    const processQueue = async () => {
      if (!pc.remoteDescription) return;
      
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
    };

    // Helper to create offer
    const doCreateOffer = async () => {
      if (!pc || !channelReadyRef.current || offerCreatedRef.current) {
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

        await sendChannelSignal('offer', {
          type: offer.type,
          sdp: offer.sdp,
        });
      } catch (error) {
        console.error('Error creating offer:', error);
        offerCreatedRef.current = false;
      }
    };

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }: { payload: SignalingMessage }) => {
        console.log('Received offer message:', payload);
        if (payload.from === userId) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          console.log('Remote description set from offer, creating answer');

          await processQueue();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('Local description set from answer, sending');

          await sendChannelSignal('answer', {
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

          await processQueue();
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
      .on('broadcast', { event: 'user-ready' }, ({ payload }: { payload: SignalingMessage }) => {
        console.log('User ready:', payload.from, payload.role);

        if (role === 'interviewer' && payload.role === 'candidate') {
          console.log('Candidate is ready, interviewer will create offer when channel is ready');
          remoteReadyRef.current = true;

          if (channelReadyRef.current && !offerCreatedRef.current) {
            console.log('Both sides ready, creating offer');
            doCreateOffer();
          }
        }
      })
      .subscribe(async (status) => {
        console.log('Channel subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsChannelReady(true);
          channelReadyRef.current = true;
          console.log('Channel ready, announcing presence');

          await sendChannelSignal('user-ready', { ready: true });

          if (role === 'candidate') {
            console.log('Candidate: waiting for offer from interviewer');
          } else {
            console.log('Interviewer: waiting for candidate to be ready');
            // Check if candidate already sent ready
            if (remoteReadyRef.current && !offerCreatedRef.current) {
              console.log('Candidate already ready, creating offer now');
              doCreateOffer();
            }
          }
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up WebRTC connection');
      isInitializingRef.current = false;
      offerCreatedRef.current = false;
      remoteReadyRef.current = false;
      channelReadyRef.current = false;
      iceCandidatesQueue.current = [];
      setIsChannelReady(false);
      
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [sessionId, userId, role, localStream]);

  return { peerConnection: peerConnectionRef.current };
};
