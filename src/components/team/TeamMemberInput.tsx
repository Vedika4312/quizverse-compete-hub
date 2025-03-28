
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamMemberInputProps {
  index: number;
  name: string;
  email: string;
  onNameChange: (index: number, value: string) => void;
  onEmailChange: (index: number, value: string) => void;
  disabled?: boolean;
}

export const TeamMemberInput = ({ 
  index, 
  name, 
  email, 
  onNameChange, 
  onEmailChange, 
  disabled 
}: TeamMemberInputProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`memberName${index}`}>Team Member {index + 1} Name</Label>
        <Input
          id={`memberName${index}`}
          value={name}
          onChange={(e) => onNameChange(index, e.target.value)}
          placeholder={`Enter member ${index + 1} name`}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`memberEmail${index}`}>Team Member {index + 1} Email</Label>
        <Input
          id={`memberEmail${index}`}
          type="email"
          value={email}
          onChange={(e) => onEmailChange(index, e.target.value)}
          placeholder={`Enter member ${index + 1} email`}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
