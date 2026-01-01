import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
// This import is still here, but the format function is not directly used in the new date display. `toLocaleDateString` is used instead.

export default function AdminUsers() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== "admin") {
        window.location.href = createPageUrl("Browse");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl("AdminUsers"));
    }
  };

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      await base44.asServiceRole.entities.User.update(userId, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user status: ' + error.message);
    },
  });

  const handleToggleStatus = (userId, currentStatus) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <Badge className="bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/30 hover:bg-[#EF6418]/20">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
        <User className="w-3 h-3 mr-1" />
        Subscriber
      </Badge>
    );
  };

  // This function is no longer used in the table, but is kept as it was not explicitly removed from the outline.
  const getSubscriptionBadge = (status) => {
    const badges = {
      active: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", label: "Active" },
      canceled: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", label: "Canceled" },
      past_due: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "Past Due" },
      none: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30", label: "None" }
    };
    
    const badge = badges[status] || badges.none;
    return (
      <Badge className={`${badge.bg} ${badge.text} ${badge.border} hover:${badge.bg}`}>
        {badge.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to={createPageUrl("AdminDashboard")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-gray-400">{users.length} total users</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden"
        >
          {usersLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418] mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333333] hover:bg-transparent">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400">Subscriber Since</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id} className="border-[#333333] hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        {userItem.full_name || userItem.display_name || "—"}
                      </TableCell>
                      <TableCell className="text-gray-400">{userItem.email}</TableCell>
                      <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(userItem.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {userItem.subscriber_since 
                          ? new Date(userItem.subscriber_since).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={userItem.is_active !== false}
                            onCheckedChange={() => handleToggleStatus(userItem.id, userItem.is_active !== false)}
                            disabled={toggleUserStatusMutation.isPending}
                          />
                          <span className="text-sm text-gray-400">
                            {userItem.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}