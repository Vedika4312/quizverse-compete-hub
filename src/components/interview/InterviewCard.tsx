import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Video, ChevronRight } from "lucide-react";
import { InterviewSession } from "@/types/interview";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface InterviewCardProps {
  interview: InterviewSession;
}

const InterviewCard = ({ interview }: InterviewCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'behavioral':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'system_design':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleStartInterview = () => {
    navigate(`/interview/${interview.id}`);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground mb-2">{interview.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={getStatusColor(interview.status)}>
              {interview.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(interview.interview_type)}>
              {interview.interview_type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {interview.scheduled_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(interview.scheduled_time), 'PPP')}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{interview.duration_minutes} minutes</span>
        </div>

        {interview.interviewer_id && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Interviewer assigned</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {interview.status === 'scheduled' && (
          <Button 
            onClick={handleStartInterview}
            className="flex-1"
            size="sm"
          >
            <Video className="w-4 h-4 mr-2" />
            Start Interview
          </Button>
        )}
        {interview.status === 'in_progress' && (
          <Button 
            onClick={handleStartInterview}
            className="flex-1"
            size="sm"
          >
            <Video className="w-4 h-4 mr-2" />
            Resume Interview
          </Button>
        )}
        {interview.status === 'completed' && (
          <Button 
            onClick={handleStartInterview}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default InterviewCard;
