
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { TeamMember } from "@/types/quiz";
import { Search, Mail } from "lucide-react";

const TeamMembersTable = () => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          member_name,
          email,
          is_captain,
          joined_at,
          teams(name)
        `);

      if (error) throw error;
      
      // Transform data to include team name
      const transformedData = (data || []).map(item => ({
        id: item.id,
        team_id: item.team_id,
        team_name: item.teams?.name || 'Unknown Team',
        user_id: item.user_id,
        member_name: item.member_name,
        email: item.email,
        is_captain: item.is_captain,
        joined_at: item.joined_at
      }));
      
      setTeamMembers(transformedData);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const updateMemberEmail = async (memberId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ email })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member email has been updated",
      });

      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error updating member email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member email",
        variant: "destructive",
      });
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.member_name.toLowerCase().includes(searchLower) ||
      member.team_name.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Team Members</h2>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name, team, or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading team members...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.member_name}</TableCell>
                  <TableCell>{member.team_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={member.email || ''}
                        placeholder="Enter email"
                        size={30}
                        onChange={(e) => {
                          // Create a new member object with updated email
                          const updatedMember = { ...member, email: e.target.value };
                          // Replace the old member in the array
                          setTeamMembers(teamMembers.map(m => 
                            m.id === member.id ? updatedMember : m
                          ));
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== member.email) {
                            updateMemberEmail(member.id, e.target.value);
                          }
                        }}
                      />
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.is_captain 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.is_captain ? 'Captain' : 'Member'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  {searchTerm 
                    ? 'No team members match your search' 
                    : 'No team members found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default TeamMembersTable;
