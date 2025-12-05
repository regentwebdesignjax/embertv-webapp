import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Star, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [reviewToDelete, setReviewToDelete] = React.useState(null);

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
      base44.auth.redirectToLogin(createPageUrl("AdminReviews"));
    }
  };

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.FilmReview.list('-created_date'),
    initialData: [],
  });

  const { data: films } = useQuery({
    queryKey: ['films'],
    queryFn: () => base44.entities.Film.list(),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => base44.entities.FilmReview.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    },
  });

  const toggleApprovalMutation = useMutation({
    mutationFn: ({ reviewId, isApproved }) => 
      base44.entities.FilmReview.update(reviewId, { is_approved: !isApproved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const getFilmTitle = (filmId) => {
    const film = films.find(f => f.id === filmId);
    return film?.title || "Unknown Film";
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || "Unknown User";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDeleteClick = (review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reviewToDelete) {
      deleteReviewMutation.mutate(reviewToDelete.id);
    }
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

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EF6418] to-[#D55514] rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Review Management</h1>
              <p className="text-gray-400">{reviews.length} total reviews</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="p-6">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No reviews yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333333] hover:bg-transparent">
                        <TableHead className="text-gray-400">Film</TableHead>
                        <TableHead className="text-gray-400">User</TableHead>
                        <TableHead className="text-gray-400">Rating</TableHead>
                        <TableHead className="text-gray-400">Review</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow key={review.id} className="border-[#333333] hover:bg-white/5">
                          <TableCell className="font-medium text-white max-w-[200px]">
                            {getFilmTitle(review.film_id)}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {getUserName(review.user_id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-[#EF6418] text-[#EF6418]"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400 max-w-[300px] truncate">
                            {review.review_text || "—"}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {formatDate(review.created_date)}
                          </TableCell>
                          <TableCell>
                            {review.is_approved ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleApprovalMutation.mutate({
                                  reviewId: review.id,
                                  isApproved: review.is_approved
                                })}
                                className={
                                  review.is_approved
                                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                    : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                }
                                title={review.is_approved ? "Unapprove" : "Approve"}
                              >
                                {review.is_approved ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(review)}
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}