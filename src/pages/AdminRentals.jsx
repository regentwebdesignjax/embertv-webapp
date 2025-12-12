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
import { ArrowLeft, XCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function AdminRentals() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);

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
      newExpiresAt.setHours(newExpiresAt.getHours() + 24);
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-white">All Rentals</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                      {filteredRentals.map((rental) => (
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
              access to the film for 24 hours from now.
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
    </div>
  );
}