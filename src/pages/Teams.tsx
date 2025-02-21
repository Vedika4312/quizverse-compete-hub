
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const Teams = () => {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const { toast } = useToast();

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || members.some(member => !member)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Submit team registration
    toast({
      title: "Success!",
      description: "Team registration submitted successfully",
    });
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
                  />
                </div>
              ))}

              <Button type="submit" className="w-full">
                Register Team
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Teams;
