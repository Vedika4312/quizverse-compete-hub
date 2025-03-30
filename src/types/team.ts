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

export interface Team {
  id: string;
  name: string;
  created_at: string;
  captain_id?: string;
}

export interface TeamScore {
  id: string;
  team_id: string;
  team_name?: string;
  score: number;
  quiz_date: string;
}
