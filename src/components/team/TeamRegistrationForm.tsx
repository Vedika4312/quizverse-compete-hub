
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TeamMemberInput } from "./TeamMemberInput";
import { Card } from "@/components/ui/card";
import { TeamFormData } from "@/types/team";
import { PlusCircle, MinusCircle } from "lucide-react";

interface TeamRegistrationFormProps {
  formData: TeamFormData;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onTeamNameChange: (value: string) => void;
  onCaptainNameChange: (value: string) => void;
  onCaptainEmailChange: (value: string) => void;
  onMemberNameChange: (index: number, value: string) => void;
  onMemberEmailChange: (index: number, value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
}

export const TeamRegistrationForm = ({
  formData,
  isLoading,
  onSubmit,
  onTeamNameChange,
  onCaptainNameChange,
  onCaptainEmailChange,
  onMemberNameChange,
  onMemberEmailChange,
  onAddMember,
  onRemoveMember,
}: TeamRegistrationFormProps) => {
  const { teamName, captainName, captainEmail, members } = formData;

  return (
    <Card className="p-6 animate-slideIn">
      <h2 className="text-2xl font-semibold mb-6">Team Registration</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="teamName">Team Name</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            placeholder="Enter your team name"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium">Captain Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="captainName">Captain Name</Label>
              <Input
                id="captainName"
                value={captainName}
                onChange={(e) => onCaptainNameChange(e.target.value)}
                placeholder="Enter captain's name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="captainEmail">Captain Email</Label>
              <Input
                id="captainEmail"
                type="email"
                value={captainEmail}
                onChange={(e) => onCaptainEmailChange(e.target.value)}
                placeholder="Enter captain's email"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {members.length > 0 && (
          <div className="space-y-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Team Members</h3>
              <div className="flex gap-2">
                {members.length < 2 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={onAddMember}
                    disabled={isLoading}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-6">
              {members.map((member, index) => (
                <div key={index} className="relative border border-gray-200 rounded-lg p-4">
                  <TeamMemberInput
                    index={index}
                    name={member.name}
                    email={member.email}
                    onNameChange={onMemberNameChange}
                    onEmailChange={onMemberEmailChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    onClick={() => onRemoveMember(index)}
                    disabled={isLoading}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={onAddMember}
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Team Member (Optional)
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register Team"}
        </Button>
      </form>
    </Card>
  );
};
