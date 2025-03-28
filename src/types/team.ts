
export interface TeamMember {
  name: string;
  index: number;
  email?: string;
}

export interface TeamFormData {
  teamName: string;
  captainName: string;
  captainEmail: string;
  members: Array<{
    name: string;
    email: string;
  }>;
}
