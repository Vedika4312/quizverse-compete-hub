
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
import { UserPlus } from "lucide-react";
import type { AdminUser } from "@/types/quiz";

const AdminUsers = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchAdminUsers = async () => {
    try {
      // First get admin user IDs from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (userRoles) {
        // Transform the data to match our AdminUser interface
        const adminUsersData: AdminUser[] = userRoles.map(role => ({
          id: crypto.randomUUID(), // Generate ID since we're not using admin_management table
          user_id: role.user_id,
          added_by: '', // We don't have this information in user_roles table
          created_at: new Date().toISOString()
        }));
        
        setAdminUsers(adminUsersData);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!userEmail) {
        toast({
          title: "Error",
          description: "Please enter an email address",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('add_admin_user', {
        user_email: userEmail
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been added as an admin",
      });

      setUserEmail("");
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Admin Users Management</h2>
      
      <form onSubmit={handleAddAdmin} className="mb-8">
        <div className="flex flex-col space-y-4">
          <Label htmlFor="userEmail">Add New Admin User</Label>
          <div className="flex space-x-2">
            <Input
              id="userEmail"
              type="email"
              placeholder="Enter user email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add Admin"}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            The user must already have an account in the system.
          </p>
        </div>
      </form>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Current Admin Users</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Added On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminUsers.length > 0 ? (
              adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.user_id}</TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                  No admin users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default AdminUsers;
