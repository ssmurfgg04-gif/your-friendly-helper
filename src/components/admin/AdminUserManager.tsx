import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Mail, Shield, Briefcase, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AppRole = "admin" | "moderator" | "user";

interface AdminUser {
  id: string;
  email: string;
  role: AppRole;
  responsibilities: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

export function AdminUserManager() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [responsibilities, setResponsibilities] = useState("");

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: roles, error } = await (supabase as any)
        .from("user_roles")
        .select("user_id, role, responsibilities, created_at")
        .neq("role", "user");

      if (error) throw error;

      const adminUsers: AdminUser[] = (roles || []).map((role: any) => ({
        id: role.user_id,
        email: role.user_id,
        role: role.role as AppRole,
        responsibilities: role.responsibilities,
        created_at: role.created_at,
        last_sign_in_at: null,
        confirmed: true,
      }));

      return adminUsers;
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async ({ email: userEmail, role, responsibilities: resp }: { email: string; role: AppRole; responsibilities: string }) => {
      const { data: existingUser } = await (supabase as any)
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userEmail)
        .eq("role", role)
        .single();

      if (existingUser) {
        throw new Error("User already has this role");
      }

      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({
          user_id: userEmail,
          role: role,
          responsibilities: resp || null,
        });

      if (error) throw error;
      return { success: true, invited: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin role added successfully");
      setEmail("");
      setResponsibilities("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add admin");
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin role removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove admin role");
    },
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    addAdminMutation.mutate({ email, role: selectedRole, responsibilities });
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "default";
      case "moderator": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Admin Role
          </CardTitle>
          <CardDescription>
            Assign administrative roles by email. If the user doesn't have an account, they will be invited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Admin Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="responsibilities"
                  placeholder="Describe this admin's responsibilities..."
                  className="pl-9 min-h-[80px]"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={addAdminMutation.isPending}>
              {addAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Admin Role
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Administrators
          </CardTitle>
          <CardDescription>
            A list of all users with administrative privileges. Pending users are shown with a clock icon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin / Role</TableHead>
                    <TableHead>Responsibilities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins?.map((admin) => (
                    <TableRow key={`${admin.id}-${admin.role}`}>
                      <TableCell className="font-medium align-top">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold truncate max-w-[200px]" title={admin.email}>
                            {admin.email}
                          </div>
                          <Badge variant={getRoleBadgeVariant(admin.role)} className="text-[10px] font-bold uppercase tracking-wider">
                            {admin.role.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px] text-sm text-muted-foreground align-top">
                        {admin.responsibilities || "No specific responsibilities assigned."}
                      </TableCell>
                      <TableCell className="align-top">
                        {admin.confirmed ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>Pending Invite</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground align-top whitespace-nowrap">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAdminMutation.mutate({ userId: admin.id, role: admin.role })}
                          disabled={removeAdminMutation.isPending}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {admins?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No other administrators found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
