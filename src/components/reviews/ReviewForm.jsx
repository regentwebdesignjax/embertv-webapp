import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReviewForm({ filmId, existingReview, onSuccess }) {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [rating, setRating] = React.useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = React.useState(existingReview?.review_text || "");
  const [hoveredStar, setHoveredStar] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState(null);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setErrorMessage("You must be logged in to submit a review");
      }
    };
    getUser();
  }, []);

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.FilmReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-reviews', filmId] });
      setRating(0);
      setReviewText("");
      setErrorMessage(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to submit review");
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FilmReview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-reviews', filmId] });
      setErrorMessage(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to update review");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setErrorMessage("You must be logged in to submit a review");
      return;
    }
    
    if (rating === 0) {
      setErrorMessage("Please select a star rating");
      return;
    }

    const reviewData = {
      film_id: filmId,
      user_id: user.id,
      reviewer_name: user.full_name || user.email,
      rating: rating,
      review_text: reviewText
    };

    if (existingReview) {
      updateReviewMutation.mutate({ id: existingReview.id, data: reviewData });
    } else {
      createReviewMutation.mutate(reviewData);
    }
  };

  const isLoading = createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertDescription className="text-red-400">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div>
        <label className="text-sm font-medium text-white mb-2 block">Your Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredStar || rating)
                    ? "fill-[#EF6418] text-[#EF6418]"
                    : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-white mb-2 block">Your Review</label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this film..."
          rows={4}
          className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || rating === 0}
        className="btn-primary w-full"
      >
        {isLoading ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}