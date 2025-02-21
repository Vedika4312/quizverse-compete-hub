
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Teams = () => {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || members.some(member => !member)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          captain_id: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      const memberPromises = members.map(async (memberEmail) => {
        // You might want to validate emails here
        const { data: memberUser, error: memberUserError } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: user.id, // For now, we're adding the current user as a member
          })
          .select();

        if (memberUserError) throw memberUserError;
        return memberUser;
      });

      await Promise.all(memberPromises);

      toast({
        title: "Success!",
        description: "Team registration completed successfully",
      });

      // Redirect to index page
      navigate('/');
      
    } catch (error: any) {
      console.error('Error registering team:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

              {members.map((member, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`member${index}`}>Team Member {index + 1}</Label>
                  <Input
                    id={`member${index}`}
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder={`Enter member ${index + 1} email`}
                    type="email"
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
