
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TeamScore } from "@/types/quiz";
import { Trash2, Star } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

const TeamScores = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTeamScores = async () => {
    try {
      const { data, error } = await supabase
        .from('team_scores')
        .select(`
          id,
          team_id,
          score,
          quiz_date,
          teams(name)
        `)
        .order('quiz_date', { ascending: false });

      if (error) throw error;
      
      // Transform data to include team name
      const transformedData = (data || []).map(item => ({
        id: item.id,
        team_id: item.team_id,
        team_name: item.teams?.name || 'Unknown Team',
        score: item.score,
        quiz_date: item.quiz_date
      }));
      
      setTeamScores(transformedData as any);
    } catch (error) {
      console.error('Error fetching team scores:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team scores",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchTeamScores();
  }, []);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedTeam) {
        toast({
          title: "Error",
          description: "Please select a team",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('team_scores')
        .insert({
          team_id: selectedTeam,
          score: score,
          quiz_date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team score has been added",
      });

      setSelectedTeam("");
      setScore(0);
      fetchTeamScores();
    } catch (error: any) {
      console.error('Error adding team score:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team score",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_scores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team score has been deleted",
      });

      fetchTeamScores();
    } catch (error: any) {
      console.error('Error deleting team score:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete team score",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Team Scores Management</h2>
      
      <form onSubmit={handleAddScore} className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team">Select Team</Label>
              <Select
                value={selectedTeam}
                onValueChange={setSelectedTeam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                min="0"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="self-start">
            <Star className="w-4 h-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Score"}
          </Button>
        </div>
      </form>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Team Score History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamScores.length > 0 ? (
              teamScores.map((teamScore: any) => (
                <TableRow key={teamScore.id}>
                  <TableCell className="font-medium">{teamScore.team_name}</TableCell>
                  <TableCell>{teamScore.score}</TableCell>
                  <TableCell>
                    {teamScore.quiz_date 
                      ? new Date(teamScore.quiz_date).toLocaleDateString() 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScore(teamScore.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No team scores found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default TeamScores;
