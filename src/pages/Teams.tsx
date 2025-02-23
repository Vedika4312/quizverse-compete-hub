
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Teams = () => {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a team",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Check if user already has a team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('captain_id', user.id)
        .maybeSingle();

      if (teamError) {
        console.error('Error checking team:', teamError);
        return;
      }

      if (team) {
        setHasTeam(true);
        toast({
          title: "Team Already Exists",
          description: "You have already created a team",
        });
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !captainName || members.some(member => !member)) {
      toast({
        title: "Error",
        description: "Please fill in all fields including team name, captain name, and member names",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a team",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          captain_id: userId,
        })
        .select()
        .single();

      if (teamError) {
        if (teamError.code === '23505') {
          throw new Error("You can only create one team");
        }
        throw teamError;
      }

      // Add team members including the captain
      const memberPromises = [
        // Add captain first
        supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: userId,
            member_name: captainName
          }),
        // Then add other members
        ...members.map(memberName =>
          supabase
            .from('team_members')
            .insert({
              team_id: team.id,
              user_id: userId,
              member_name: memberName
            })
        )
      ];

      await Promise.all(memberPromises);

      setHasTeam(true);
      toast({
        title: "Success!",
        description: "Team registration completed successfully",
      });

      navigate('/');
      
    } catch (error: any) {
      console.error('Error registering team:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId || hasTeam) {
    return null; // Don't render the form if user is not authenticated or already has a team
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <Card className="p-6 animate-slideIn">
            <h2 className="text-2xl font-semibold mb-6">Team Registration</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="captainName">Captain Name</Label>
                <Input
                  id="captainName"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Enter captain's name"
                  disabled={isLoading}
                />
              </div>

              {members.map((member, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`member${index}`}>Team Member {index + 1}</Label>
                  <Input
                    id={`member${index}`}
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder={`Enter member ${index + 1} name`}
                    disabled={isLoading}
                  />
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Team"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Teams;
