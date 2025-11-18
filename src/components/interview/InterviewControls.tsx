import { Clock, Play, Square, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface InterviewControlsProps {
  duration: number; // in minutes
  onEnd?: () => void;
  onSave?: () => void;
}

const InterviewControls = ({ duration, onEnd, onSave }: InterviewControlsProps) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentLeft = (timeLeft / (duration * 60)) * 100;
    if (percentLeft > 50) return "bg-primary";
    if (percentLeft > 25) return "bg-yellow-500";
    return "bg-destructive";
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-background border-b border-border">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-base px-3 py-1">
          <Clock className="w-4 h-4 mr-2" />
          {formatTime(timeLeft)}
        </Badge>
        
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              size="sm"
              onClick={() => setIsRunning(true)}
              variant="outline"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsRunning(false)}
              variant="outline"
            >
              <Square className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Progress
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={onEnd}
        >
          End Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewControls;
