import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InterviewSession } from "@/types/interview";
import { useState } from "react";
import { format, isSameDay } from "date-fns";

interface InterviewCalendarProps {
  interviews: InterviewSession[];
}

const InterviewCalendar = ({ interviews }: InterviewCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const interviewDates = interviews
    .filter(i => i.scheduled_time)
    .map(i => new Date(i.scheduled_time!));

  const selectedDateInterviews = interviews.filter(
    i => i.scheduled_time && selectedDate && isSameDay(new Date(i.scheduled_time), selectedDate)
  );

  return (
    <Card className="p-6 border-border bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Calendar View</h3>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        modifiers={{
          interview: interviewDates
        }}
        modifiersStyles={{
          interview: {
            fontWeight: 'bold',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            color: 'hsl(var(--primary))'
          }
        }}
        className="rounded-md border border-border"
      />

      {selectedDate && selectedDateInterviews.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-sm text-foreground">
            Interviews on {format(selectedDate, 'PPP')}
          </h4>
          {selectedDateInterviews.map(interview => (
            <div 
              key={interview.id} 
              className="p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{interview.title}</span>
                <Badge variant="outline" className="text-xs">
                  {interview.scheduled_time && format(new Date(interview.scheduled_time), 'p')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDate && selectedDateInterviews.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          No interviews scheduled for this date
        </p>
      )}
    </Card>
  );
};

export default InterviewCalendar;
