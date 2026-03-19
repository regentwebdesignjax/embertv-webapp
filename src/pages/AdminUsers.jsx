import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, User, Trash2, Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink,
} from "@/components/ui/pagination";
import { toast } from "react-hot-toast";

const PER_PAGE = 25;

export default function AdminUsers() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkAwardDialogOpen, setBulkAwardDialogOpen] = useState(false);
  const [selectedFilmId, setSelectedFilmId] = useState("");

  const queryClient = useQueryClient();

  React.useEffect(() => { checkAuth(); }, []);

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

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const { data: films = [] } = useQuery({
    queryKey: ['films'],
    queryFn: () => base44.entities.Film.list(),
  });

  const totalPages = Math.ceil(users.length / PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSelectAll = () => {
    const allIds = paginatedUsers.map(u => u.id);
    const allSelected = allIds.every(id => selectedUserIds.includes(id));
    setSelectedUserIds(allSelected
      ? selectedUserIds.filter(id => !allIds.includes(id))
      : [...new Set([...selectedUserIds, ...allIds])]
    );
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const selected = users.filter(u => selectedUserIds.includes(u.id));
    const header = "Name,Email,Role,Joined Date";
    const rows = selected.map(u =>
      `"${u.full_name || ""}","${u.email}","${u.role}","${new Date(u.created_date).toLocaleDateString()}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin_users_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkAwardRentalMutation = useMutation({
    mutationFn: async (filmId) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await Promise.all(selectedUserIds.map(userId =>
        base44.entities.FilmRental.create({
          user_id: userId,
          film_id: filmId,
          status: "active",
          amount_cents: 0,
          purchased_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
      ));
    },
    onSuccess: () => {
      toast.success(`Free rental awarded to ${selectedUserIds.length} user(s)`);
      setBulkAwardDialogOpen(false);
      setSelectedFilmId("");
      setSelectedUserIds([]);
    },
  });

  const bulkDeleteUsersMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedUserIds.map(id => base44.entities.User.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success(`${selectedUserIds.length} user(s) deleted`);
      setSelectedUserIds([]);
      setBulkDeleteDialogOpen(false);
    },
  });

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

  const allPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id));

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to={createPageUrl("AdminDashboard")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
          </Link>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-gray-400">{users.length} total users</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden"
        >
          {/* Bulk Actions Bar */}
          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333333] bg-[#1F1F1F]">
              <span className="text-sm text-gray-400">{selectedUserIds.length} selected</span>
              <Button size="sm" onClick={handleExportCSV} className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />Export CSV
              </Button>
              <Button size="sm" onClick={() => setBulkAwardDialogOpen(true)} className="btn-primary">
                <Gift className="w-4 h-4 mr-2" />Award Free Rental
              </Button>
              <Button size="sm" onClick={() => setBulkDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                <Trash2 className="w-4 h-4 mr-2" />Delete Selected
              </Button>
            </div>
          )}

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
                        checked={allPageSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-500"
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
                  {paginatedUsers.map((userItem) => (
                    <TableRow key={userItem.id} className="border-[#333333] hover:bg-white/5">
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(userItem.id)}
                          onCheckedChange={() => toggleSelectUser(userItem.id)}
                          className="border-gray-500"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-white">{userItem.full_name || "—"}</TableCell>
                      <TableCell className="text-gray-400">{userItem.email}</TableCell>
                      <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(userItem.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"
                          onClick={() => { setUserToDelete(userItem); setDeleteDialogOpen(true); }}
                          disabled={deleteUserMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-[#333333]">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-40 text-white" : "cursor-pointer text-white hover:bg-white/10"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className={`cursor-pointer ${page === currentPage ? "bg-[#EF6418] text-white border-[#EF6418]" : "text-white hover:bg-white/10"}`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-40 text-white" : "cursor-pointer text-white hover:bg-white/10"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
              <span className="font-semibold text-white">{userToDelete?.email}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUserMutation.mutate(userToDelete.id)}
              className="bg-red-600 text-white hover:bg-red-700" disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {selectedUserIds.length} Users</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete all {selectedUserIds.length} selected user accounts. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteUsersMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700" disabled={bulkDeleteUsersMutation.isPending}>
              {bulkDeleteUsersMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Award Rental Dialog */}
      <Dialog open={bulkAwardDialogOpen} onOpenChange={setBulkAwardDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle>Award Free Rental</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a film to award as a free 24-hour rental to {selectedUserIds.length} selected user(s).
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
            <SelectTrigger className="bg-[#0A0A0A] border-[#333333] text-white">
              <SelectValue placeholder="Select a film..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333]">
              {films.map(film => (
                <SelectItem key={film.id} value={film.id} className="text-white focus:bg-white/10">
                  {film.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => setBulkAwardDialogOpen(false)} className="btn-secondary">Cancel</Button>
            <Button
              onClick={() => bulkAwardRentalMutation.mutate(selectedFilmId)}
              disabled={!selectedFilmId || bulkAwardRentalMutation.isPending}
              className="btn-primary"
            >
              {bulkAwardRentalMutation.isPending ? "Awarding..." : "Award Rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}