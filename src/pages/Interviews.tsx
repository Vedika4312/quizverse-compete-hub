import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InterviewSession } from "@/types/interview";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InterviewCard from "@/components/interview/InterviewCard";
import InterviewFilters from "@/components/interview/InterviewFilters";
import InterviewCalendar from "@/components/interview/InterviewCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Interviews = () => {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      setInterviews((data as InterviewSession[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const statusMatch = statusFilter === "all" || interview.status === statusFilter;
    const typeMatch = typeFilter === "all" || interview.interview_type === typeFilter;
    return statusMatch && typeMatch;
  });

  const upcomingInterviews = filteredInterviews.filter(
    i => i.status === 'scheduled' || i.status === 'in_progress'
  );

  const pastInterviews = filteredInterviews.filter(
    i => i.status === 'completed' || i.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Interviews</h1>
            <p className="text-muted-foreground">
              Manage and track your interview sessions
            </p>
          </div>
          
          <div className="flex gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="w-4 h-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={() => toast({ title: "Feature coming soon!" })}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </div>

        {/* Filters */}
        <InterviewFilters
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
        />

        {/* Content */}
        {view === "list" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Interviews */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Upcoming Interviews ({upcomingInterviews.length})
                </h2>
                {upcomingInterviews.length > 0 ? (
                  <div className="grid gap-4">
                    {upcomingInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-lg">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming interviews</p>
                  </div>
                )}
              </div>

              {/* Past Interviews */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Past Interviews ({pastInterviews.length})
                </h2>
                {pastInterviews.length > 0 ? (
                  <div className="grid gap-4">
                    {pastInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-lg">
                    <p className="text-muted-foreground">No past interviews</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <InterviewCalendar interviews={interviews} />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <InterviewCalendar interviews={interviews} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;
