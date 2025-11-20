import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Signal, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStats {
  localCandidateType: string;
  remoteCandidateType: string;
  connectionType: string;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  roundTripTime: number;
}

interface ConnectionDiagnosticsProps {
  peerConnection: RTCPeerConnection | null;
}

const ConnectionDiagnostics = ({ peerConnection }: ConnectionDiagnosticsProps) => {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!peerConnection) return;

    const updateStats = async () => {
      try {
        const statsReport = await peerConnection.getStats(null);
        let newStats: Partial<ConnectionStats> = {};
        
        statsReport.forEach((report) => {
          // Get candidate pair information
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            statsReport.forEach((stat) => {
              if (stat.id === report.localCandidateId) {
                newStats.localCandidateType = stat.candidateType || 'unknown';
              }
              if (stat.id === report.remoteCandidateId) {
                newStats.remoteCandidateType = stat.candidateType || 'unknown';
              }
            });

            // Determine connection type
            const local = newStats.localCandidateType || '';
            const remote = newStats.remoteCandidateType || '';
            
            if (local === 'relay' || remote === 'relay') {
              newStats.connectionType = 'TURN (Relay)';
            } else if (local === 'srflx' || remote === 'srflx') {
              newStats.connectionType = 'STUN (Server Reflexive)';
            } else if (local === 'host' && remote === 'host') {
              newStats.connectionType = 'Direct (P2P)';
            } else {
              newStats.connectionType = 'Mixed';
            }
          }

          // Get transport stats
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            newStats.bytesReceived = report.bytesReceived || 0;
            newStats.packetsLost = report.packetsLost || 0;
          }
          
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            newStats.bytesSent = report.bytesSent || 0;
          }

          // Get RTT
          if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
            newStats.roundTripTime = report.roundTripTime ? Math.round(report.roundTripTime * 1000) : 0;
          }
        });

        if (newStats.connectionType) {
          setStats(newStats as ConnectionStats);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    };

    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial call

    return () => clearInterval(interval);
  }, [peerConnection]);

  if (!isConnected || !stats) {
    return null;
  }

  const getConnectionIcon = () => {
    if (stats.connectionType.includes('TURN')) {
      return <Signal className="h-4 w-4" />;
    } else if (stats.connectionType.includes('STUN')) {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  const getConnectionColor = () => {
    if (stats.connectionType.includes('TURN')) {
      return 'default'; // TURN is good for restrictive networks
    } else if (stats.connectionType.includes('Direct')) {
      return 'default'; // Direct is best
    }
    return 'secondary';
  };

  return (
    <Card className="p-3 bg-background/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <Badge variant={getConnectionColor()} className="text-xs">
            {stats.connectionType}
          </Badge>
        </div>
        
        {stats.roundTripTime > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RTT:</span>
            <span className="font-medium">{stats.roundTripTime}ms</span>
          </div>
        )}
        
        {stats.packetsLost > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Lost:</span>
            <span className="font-medium text-destructive">{stats.packetsLost}</span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        Local: {stats.localCandidateType} • Remote: {stats.remoteCandidateType}
      </div>
    </Card>
  );
};

export default ConnectionDiagnostics;
