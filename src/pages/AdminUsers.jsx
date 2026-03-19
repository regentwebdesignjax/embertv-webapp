import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, User, Trash2, Gift, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";

export default function AdminUsers() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [awardRentalOpen, setAwardRentalOpen] = useState(false);
  const [selectedFilmId, setSelectedFilmId] = useState("");

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

  const { data: films } = useQuery({
    queryKey: ['films-for-award'],
    queryFn: () => base44.entities.Film.list(),
    initialData: [],
  });

  // --- Single user delete ---
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => toast.error("Failed to delete user: " + error.message),
  });

  // --- Bulk delete ---
  const bulkDeleteMutation = useMutation({
    mutationFn: () => Promise.all(selectedUserIds.map(id => base44.entities.User.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success(`${selectedUserIds.length} users deleted`);
      setSelectedUserIds([]);
      setBulkDeleteOpen(false);
    },
    onError: (error) => toast.error("Bulk delete failed: " + error.message),
  });

  // --- Award free rental ---
  const bulkAwardRentalMutation = useMutation({
    mutationFn: () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return Promise.all(
        selectedUserIds.map(userId =>
          base44.entities.FilmRental.create({
            user_id: userId,
            film_id: selectedFilmId,
            status: "active",
            amount_cents: 0,
            expires_at: expiresAt,
            purchased_at: new Date().toISOString(),
          })
        )
      );
    },
    onSuccess: () => {
      toast.success(`Free rental awarded to ${selectedUserIds.length} users`);
      setSelectedUserIds([]);
      setAwardRentalOpen(false);
      setSelectedFilmId("");
    },
    onError: (error) => toast.error("Award failed: " + error.message),
  });

  // --- Selection handlers ---
  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // --- CSV Export ---
  const handleExportCSV = () => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    const rows = [
      ["Name", "Email", "Role", "Joined Date"],
      ...selectedUsers.map(u => [
        u.full_name || "",
        u.email,
        u.role || "user",
        new Date(u.created_date).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <Badge className="bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/30 hover:bg-[#EF6418]/20">
          <Shield className="w-3 h-3 mr-1" />Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
        <User className="w-3 h-3 mr-1" />Subscriber
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

  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && !allSelected;

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to={createPageUrl("AdminDashboard")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-gray-400">{users.length} total users</p>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-wrap items-center gap-3 bg-[#1A1A1A] border border-[#EF6418]/40 rounded-xl px-5 py-3"
          >
            <span className="text-white font-medium text-sm mr-2">
              {selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""} selected
            </span>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="btn-secondary gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setAwardRentalOpen(true)}
              className="btn-primary gap-2"
            >
              <Gift className="w-4 h-4" />
              Award Free Rental
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </Button>
          </motion.div>
        )}

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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        className="border-[#555] data-[state=checked]:bg-[#EF6418] data-[state=checked]:border-[#EF6418]"
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => {
                    const isSelected = selectedUserIds.includes(userItem.id);
                    return (
                      <TableRow
                        key={userItem.id}
                        className={`border-[#333333] hover:bg-white/5 transition-colors ${isSelected ? "bg-white/5" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectUser(userItem.id)}
                            className="border-[#555] data-[state=checked]:bg-[#EF6418] data-[state=checked]:border-[#EF6418]"
                            aria-label={`Select ${userItem.email}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {userItem.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-gray-400">{userItem.email}</TableCell>
                        <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(userItem.created_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setUserToDelete(userItem); setDeleteDialogOpen(true); }}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">{userToDelete?.email}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(userToDelete.id)}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {selectedUserIds.length} Users</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-white">{selectedUserIds.length} user account{selectedUserIds.length > 1 ? "s" : ""}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedUserIds.length} Users`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Award Free Rental Dialog */}
      <Dialog open={awardRentalOpen} onOpenChange={setAwardRentalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle>Award Free Rental</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a film to award a free 24-hour rental to {selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-gray-300 mb-2 block">Select Film</Label>
            <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
              <SelectTrigger className="bg-[#0A0A0A] border-[#333333] text-white">
                <SelectValue placeholder="Choose a film..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                {films.map(film => (
                  <SelectItem key={film.id} value={film.id} className="focus:bg-white/10 focus:text-white">
                    {film.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setAwardRentalOpen(false)} className="btn-secondary">Cancel</Button>
            <Button
              onClick={() => bulkAwardRentalMutation.mutate()}
              disabled={!selectedFilmId || bulkAwardRentalMutation.isPending}
              className="btn-primary gap-2"
            >
              <Gift className="w-4 h-4" />
              {bulkAwardRentalMutation.isPending ? "Awarding..." : "Award Rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}