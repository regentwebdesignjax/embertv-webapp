import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, XCircle, Clock, CheckCircle2, AlertCircle, Gift, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function AdminRentals() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedFilmId, setSelectedFilmId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

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
    } catch (error) {
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["admin-rentals"],
    queryFn: async () => {
      const rentals = await base44.entities.FilmRental.list("-created_date");
      return rentals;
    },
    enabled: !!user,
  });

  const { data: films = [] } = useQuery({
    queryKey: ["films"],
    queryFn: () => base44.entities.Film.list(),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const deactivateRentalMutation = useMutation({
    mutationFn: async (rentalId) => {
      await base44.entities.FilmRental.update(rentalId, {
        status: "expired",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-rentals"]);
      toast.success("Rental deactivated successfully");
      setDeactivateDialogOpen(false);
      setSelectedRental(null);
    },
    onError: (error) => {
      toast.error("Failed to deactivate rental: " + error.message);
    },
  });

  const reactivateRentalMutation = useMutation({
    mutationFn: async (rentalId) => {
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 48);
      await base44.entities.FilmRental.update(rentalId, {
        status: "active",
        expires_at: newExpiresAt.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-rentals"]);
      toast.success("Rental reactivated successfully");
      setReactivateDialogOpen(false);
      setSelectedRental(null);
    },
    onError: (error) => {
      toast.error("Failed to reactivate rental: " + error.message);
    },
  });

  const handleDeactivateClick = (rental) => {
    setSelectedRental(rental);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (selectedRental) {
      deactivateRentalMutation.mutate(selectedRental.id);
    }
  };

  const handleReactivateClick = (rental) => {
    setSelectedRental(rental);
    setReactivateDialogOpen(true);
  };

  const handleReactivateConfirm = () => {
    if (selectedRental) {
      reactivateRentalMutation.mutate(selectedRental.id);
    }
  };

  const awardRentalMutation = useMutation({
    mutationFn: async ({ userId, filmId }) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      await base44.entities.FilmRental.create({
        user_id: userId,
        film_id: filmId,
        status: "active",
        purchased_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_cents: 0,
        currency: "usd",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-rentals"]);
      toast.success("Free 48-hour rental awarded successfully");
      setAwardDialogOpen(false);
      setSelectedUserId("");
      setSelectedFilmId("");
    },
    onError: (error) => {
      toast.error("Failed to award rental: " + error.message);
    },
  });

  const handleAwardRental = () => {
    if (selectedUserId && selectedFilmId) {
      awardRentalMutation.mutate({ userId: selectedUserId, filmId: selectedFilmId });
    }
  };

  const deleteRentalMutation = useMutation({
    mutationFn: async (rentalId) => {
      await base44.entities.FilmRental.delete(rentalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-rentals"]);
      toast.success("Rental deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedRental(null);
    },
    onError: (error) => {
      toast.error("Failed to delete rental: " + error.message);
    },
  });

  const bulkDeleteRentalsMutation = useMutation({
    mutationFn: async () => {
      const rentalsToDelete = rentals.filter((rental) => {
        return rental.status === "pending" || rental.status === "expired" || rental.status === "failed";
      });
      
      await Promise.all(
        rentalsToDelete.map((rental) => base44.entities.FilmRental.delete(rental.id))
      );
      
      return rentalsToDelete.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(["admin-rentals"]);
      toast.success(`Deleted ${count} rental(s) successfully`);
      setBulkDeleteDialogOpen(false);
      setCurrentPage(1);
    },
    onError: (error) => {
      toast.error("Failed to delete rentals: " + error.message);
    },
  });

  const handleDeleteClick = (rental) => {
    setSelectedRental(rental);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRental) {
      deleteRentalMutation.mutate(selectedRental.id);
    }
  };

  const handleBulkDeleteConfirm = () => {
    bulkDeleteRentalsMutation.mutate();
  };

  const getFilmTitle = (filmId) => {
    const film = films.find((f) => f.id === filmId);
    return film ? film.title : "Unknown Film";
  };

  const getUserEmail = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : "Unknown User";
  };

  const getStatusBadge = (rental) => {
    const now = new Date();
    const expiresAt = rental.expires_at ? new Date(rental.expires_at) : null;

    if (rental.status === "active" && expiresAt && now < expiresAt) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (rental.status === "pending") {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    } else if (rental.status === "failed") {
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
  };

  const isRentalActive = (rental) => {
    const now = new Date();
    const expiresAt = rental.expires_at ? new Date(rental.expires_at) : null;
    return rental.status === "active" && expiresAt && now < expiresAt;
  };

  const filteredRentals = rentals.filter((rental) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return isRentalActive(rental);
    if (statusFilter === "expired") {
      const now = new Date();
      const expiresAt = rental.expires_at ? new Date(rental.expires_at) : null;
      return rental.status === "expired" || (expiresAt && now >= expiresAt);
    }
    return rental.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredRentals.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedRentals = filteredRentals.slice(startIndex, endIndex);

  const failedExpiredCount = rentals.filter(
    (r) => r.status === "pending" || r.status === "expired" || r.status === "failed"
  ).length;

  if (loading || rentalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Link
              to={createPageUrl("AdminDashboard")}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              Rental Management
            </h1>
            <p className="text-gray-400">
              View and manage all film rentals
            </p>
          </div>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-white">All Rentals</CardTitle>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setAwardDialogOpen(true)}
                      className="bg-[#EF6418] hover:bg-[#D55514] text-white"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Award Free Rental
                    </Button>
                    {failedExpiredCount > 0 && (
                      <Button
                        onClick={() => setBulkDeleteDialogOpen(true)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Failed/Expired ({failedExpiredCount})
                      </Button>
                    )}
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[180px] bg-[#000000] border-[#333333] text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                        <SelectItem value="all">All Rentals</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Show per page:</span>
                  <Select value={perPage.toString()} onValueChange={(value) => { setPerPage(parseInt(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[100px] bg-[#000000] border-[#333333] text-white h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="75">75</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredRentals.length)} of {filteredRentals.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRentals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No rentals found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333333] hover:bg-transparent">
                        <TableHead className="text-gray-400">User</TableHead>
                        <TableHead className="text-gray-400">Film</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Purchased</TableHead>
                        <TableHead className="text-gray-400">Expires</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRentals.map((rental) => (
                        <TableRow
                          key={rental.id}
                          className="border-[#333333] hover:bg-white/5"
                        >
                          <TableCell className="text-white">
                            {getUserEmail(rental.user_id)}
                          </TableCell>
                          <TableCell className="text-white">
                            {getFilmTitle(rental.film_id)}
                          </TableCell>
                          <TableCell>{getStatusBadge(rental)}</TableCell>
                          <TableCell className="text-gray-400">
                            {rental.purchased_at
                              ? format(new Date(rental.purchased_at), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {rental.expires_at
                              ? format(new Date(rental.expires_at), "MMM d, yyyy HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {rental.amount_cents
                              ? `$${(rental.amount_cents / 100).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {isRentalActive(rental) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivateClick(rental)}
                                  disabled={deactivateRentalMutation.isPending}
                                >
                                  Deactivate
                                </Button>
                              )}
                              {!isRentalActive(rental) && (rental.status === "expired" || rental.status === "failed") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleReactivateClick(rental)}
                                  disabled={reactivateRentalMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Reactivate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(rental)}
                                disabled={deleteRentalMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredRentals.length > 0 && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-[#333333]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate Rental</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to deactivate this rental? The user will lose
              access to the film immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deactivateRentalMutation.isPending}
            >
              {deactivateRentalMutation.isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reactivate Rental</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to reactivate this rental? The user will regain
              access to the film for 48 hours from now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateConfirm}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={reactivateRentalMutation.isPending}
            >
              {reactivateRentalMutation.isPending ? "Reactivating..." : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#EF6418]" />
              Award Free Rental
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Grant a user free 48-hour access to any film
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select" className="text-white">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select" className="bg-[#000000] border-[#333333] text-white">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white max-h-[200px]">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name ? `${user.full_name} (${user.email})` : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="film-select" className="text-white">Select Film</Label>
              <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
                <SelectTrigger id="film-select" className="bg-[#000000] border-[#333333] text-white">
                  <SelectValue placeholder="Choose a film" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white max-h-[200px]">
                  {films.map((film) => (
                    <SelectItem key={film.id} value={film.id}>
                      {film.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAwardDialogOpen(false);
                setSelectedUserId("");
                setSelectedFilmId("");
              }}
              className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAwardRental}
              disabled={!selectedUserId || !selectedFilmId || awardRentalMutation.isPending}
              className="bg-[#EF6418] hover:bg-[#D55514] text-white"
            >
              {awardRentalMutation.isPending ? "Awarding..." : "Award Rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Rental</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to permanently delete this rental record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteRentalMutation.isPending}
            >
              {deleteRentalMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Clear Failed/Expired Rentals</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to permanently delete all pending, expired, and failed rental records? 
              This will remove {failedExpiredCount} rental(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#000000] border-[#333333] text-white hover:bg-[#2A2A2A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={bulkDeleteRentalsMutation.isPending}
            >
              {bulkDeleteRentalsMutation.isPending ? "Deleting..." : `Delete ${failedExpiredCount} Rental(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}