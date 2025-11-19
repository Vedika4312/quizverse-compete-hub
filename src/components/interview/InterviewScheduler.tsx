import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Building } from "lucide-react";
import { format } from "date-fns";

interface CandidateProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  skills?: string[];
  experience_years?: number;
  current_company?: string;
  preferred_role?: string;
}

interface Company {
  id: string;
  name: string;
}

const InterviewScheduler = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    candidate_id: "",
    interviewer_id: "",
    company_id: "",
    scheduled_time: "",
    duration_minutes: "60",
    interview_type: "technical" as "technical" | "behavioral" | "system_design",
    notes: "",
  });

  useEffect(() => {
    fetchCandidates();
    fetchCompanies();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, email, phone, skills, experience_years, current_company, preferred_role')
        .order('full_name');

      if (error) throw error;
      setCandidates(data || []);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('interview_sessions')
        .insert({
          title: formData.title,
          candidate_id: formData.candidate_id,
          interviewer_id: formData.interviewer_id || user.id,
          company_id: formData.company_id || null,
          scheduled_time: formData.scheduled_time,
          duration_minutes: parseInt(formData.duration_minutes),
          interview_type: formData.interview_type,
          status: 'scheduled',
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Interview Scheduled",
        description: "The candidate will be notified about the interview.",
      });

      // Reset form
      setFormData({
        title: "",
        candidate_id: "",
        interviewer_id: "",
        company_id: "",
        scheduled_time: "",
        duration_minutes: "60",
        interview_type: "technical",
        notes: "",
      });
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

  return (
    <Card className="p-6 border-border bg-card">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Schedule Interview</h2>
      
      <form onSubmit={handleSchedule} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Interview Title */}
          <div className="md:col-span-2">
            <Label htmlFor="title">Interview Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Frontend Developer Interview"
              required
              className="mt-1"
            />
          </div>

          {/* Candidate Selection */}
          <div>
            <Label htmlFor="candidate">
              <User className="w-4 h-4 inline mr-2" />
              Select Candidate *
            </Label>
            <Select
              value={formData.candidate_id}
              onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.full_name}
                    {candidate.current_company && candidate.experience_years !== undefined
                      ? ` - ${candidate.current_company} (${candidate.experience_years} yrs)`
                      : ` (${candidate.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Selection */}
          <div>
            <Label htmlFor="company">
              <Building className="w-4 h-4 inline mr-2" />
              Company (Optional)
            </Label>
            <Select
              value={formData.company_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, company_id: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a company (optional)" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type */}
          <div>
            <Label htmlFor="type">Interview Type *</Label>
            <Select
              value={formData.interview_type}
              onValueChange={(value: any) => setFormData({ ...formData, interview_type: value })}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="system_design">System Design</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">
              <Clock className="w-4 h-4 inline mr-2" />
              Duration (minutes) *
            </Label>
            <Select
              value={formData.duration_minutes}
              onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="md:col-span-2">
            <Label htmlFor="scheduled_time">
              <Calendar className="w-4 h-4 inline mr-2" />
              Scheduled Date & Time *
            </Label>
            <Input
              id="scheduled_time"
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              required
              className="mt-1"
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any special instructions or notes for this interview..."
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Scheduling..." : "Schedule Interview"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              title: "",
              candidate_id: "",
              interviewer_id: "",
              company_id: "",
              scheduled_time: "",
              duration_minutes: "60",
              interview_type: "technical",
              notes: "",
            })}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default InterviewScheduler;
