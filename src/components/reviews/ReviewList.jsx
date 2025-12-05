import React from "react";
import { motion } from "framer-motion";
import { Star, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReviewList({ reviews, users }) {
  const getUserName = (review) => {
    // First check if reviewer_name is stored on the review itself
    if (review.reviewer_name) {
      return review.reviewer_name;
    }
    // Fallback to looking up from users list
    const user = users?.find(u => u.id === review.user_id);
    return user?.full_name || user?.email || "Anonymous";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No reviews yet. Be the first to review this film!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EF6418]/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#EF6418]" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{getUserName(review)}</p>
                    <p className="text-sm text-gray-400">{formatDate(review.created_date)}</p>
                  </div>
                </div>
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
              </div>
              {review.review_text && (
                <p className="text-gray-300 leading-relaxed">{review.review_text}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}