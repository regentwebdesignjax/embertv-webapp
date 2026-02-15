import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Star, Info, LogIn, Play, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewList from "../components/reviews/ReviewList";

export default function FilmDetail() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [slug, setSlug] = React.useState(null);
  const [rentingInProgress, setRentingInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);

  React.useEffect(() => {
    checkAuth();
    const urlParams = new URLSearchParams(location.search);
    const filmSlug = urlParams.get("slug");
    setSlug(filmSlug);
  }, [location]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const { data: films } = useQuery({
    queryKey: ['film', slug],
    queryFn: async () => {
      if (!slug) return [];
      return await base44.entities.Film.filter({ slug: slug });
    },
    enabled: !!slug
  });

  const { data: activeRental, refetch: refetchRental } = useQuery({
    queryKey: ['rental', user?.id, films?.[0]?.id],
    queryFn: async () => {
      if (!user || !films?.[0]) return null;

      const rentals = await base44.entities.FilmRental.filter({
        user_id: user.id,
        film_id: films[0].id,
        status: "active"
      }, '-created_date', 1);

      if (rentals.length === 0) return null;

      const rental = rentals[0];
      const now = new Date();
      const expiresAt = new Date(rental.expires_at);

      if (now >= expiresAt) {
        await base44.entities.FilmRental.update(rental.id, {
          status: "expired"
        });
        return null;
      }

      return rental;
    },
    enabled: !!user && !!films?.[0],
    refetchInterval: 60000
  });

  const { data: reviews } = useQuery({
    queryKey: ['film-reviews', films?.[0]?.id],
    queryFn: async () => {
      if (!films?.[0]) return [];
      return await base44.entities.FilmReview.filter({
        film_id: films[0].id,
        is_approved: true
      }, '-created_date');
    },
    enabled: !!films?.[0],
    initialData: []
  });

  const { data: userReview } = useQuery({
    queryKey: ['user-review', user?.id, films?.[0]?.id],
    queryFn: async () => {
      if (!user || !films?.[0]) return null;
      const userReviews = await base44.entities.FilmReview.filter({
        film_id: films[0].id,
        user_id: user.id
      }, '-created_date', 1);
      return userReviews.length > 0 ? userReviews[0] : null;
    },
    enabled: !!user && !!films?.[0]
  });

  const { data: reviewUsers } = useQuery({
    queryKey: ['review-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleRentClick = async () => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl(`FilmDetail?slug=${slug}`));
      return;
    }

    setRentingInProgress(true);
    setErrorMessage(null);

    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('access_token');
      
      // Make direct fetch call with Authorization header
      const response = await fetch(`${window.location.origin}/api/functions/createRentalCheckout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          film_id: films[0].id
        })
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setErrorMessage(data.error || 'Failed to create checkout session');
        setRentingInProgress(false);
      }
    } catch (error) {
      console.error('Error creating rental:', error);
      const errorMsg = error.message || 'Failed to start rental process. Please try again.';
      setErrorMessage(errorMsg);
      setRentingInProgress(false);
    }
  };

  const film = films && films.length > 0 ? films[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-4">Film Not Found</h1>
        <p className="text-gray-400 mb-8">The film you're looking for doesn't exist.</p>
        <Link to={createPageUrl("Browse")}>
          <Button className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const bannerUrl = film.banner_image_url || film.thumbnail_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80";
  const rentalPrice = film.rental_price_cents ? (film.rental_price_cents / 100).toFixed(2) : null;
  const hasActiveRental = !!activeRental;

  const formatExpirationTime = (expiresAt) => {
    const date = new Date(expiresAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Hero Banner */}
      <section className="relative h-[70vh] sm:h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={bannerUrl}
            alt={film.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <Link to={createPageUrl("Browse")}>
              <Button
                variant="ghost"
                className="mb-6 text-white hover:bg-white/10 hover:text-white -ml-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Browse
              </Button>
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {film.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              {film.rating && (
                <Badge className="bg-[#EF6418] hover:bg-[#D55514] text-white border-0 text-sm px-3 py-1">
                  {film.rating}
                </Badge>
              )}
              {film.release_year && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>{film.release_year}</span>
                </div>
              )}
              {film.duration_minutes && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{film.duration_minutes} min</span>
                </div>
              )}
              {film.genre && (
                <Badge variant="outline" className="border-white/30 text-white">
                  {film.genre}
                </Badge>
              )}
            </div>

            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              {film.short_description}
            </p>

            {hasActiveRental && (
              <Badge className="bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/30 text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Rental Active - Expires {formatExpirationTime(activeRental.expires_at)}
              </Badge>
            )}
          </motion.div>
        </div>
      </section>

      {/* Film Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {errorMessage && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertDescription className="text-red-400">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {hasActiveRental && film.full_movie_embed_code ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Play className="w-6 h-6 text-[#EF6418]" />
                      Full Movie
                    </h2>
                  </div>
                  <div
                    className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-[#EF6418]/30"
                    dangerouslySetInnerHTML={{ __html: film.full_movie_embed_code }}
                  />
                </div>
              ) : film.trailer_embed_code ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Play className="w-6 h-6 text-gray-400" />
                      Trailer
                    </h2>
                  </div>
                  <div
                    className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-[#333333]"
                    dangerouslySetInnerHTML={{ __html: film.trailer_embed_code }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-[#1A1A1A] rounded-xl border-2 border-[#333333] flex items-center justify-center">
                  <div className="text-center">
                    <Info className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Video not available</p>
                  </div>
                </div>
              )}

              {/* Rental CTA */}
              {!hasActiveRental && (
                <Card className="mt-6 bg-gradient-to-br from-[#EF6418]/10 to-[#D55514]/10 border-[#EF6418]/30">
                  <CardContent className="p-6">
                    {!user ? (
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-3">Watch the Full Film</h3>
                        <p className="text-gray-300 mb-6">
                          Log in or sign up to rent this film for 24-hour access
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            onClick={() => base44.auth.redirectToLogin(createPageUrl(`FilmDetail?slug=${slug}`))}
                            className="btn-secondary font-semibold"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            Log In
                          </Button>
                          <Button
                            onClick={() => base44.auth.redirectToLogin(createPageUrl(`FilmDetail?slug=${slug}`))}
                            className="btn-primary font-semibold"
                          >
                            Sign Up
                          </Button>
                        </div>
                      </div>
                    ) : rentalPrice ? (
                      <div className="text-center">
                        <h3 className="text-[#FFFFFF] mb-2 text-xl font-bold">Rent This Film</h3>
                        <p className="text-gray-300 mb-6">
                          Get 24-hour unlimited access to the full film
                        </p>
                        <div className="mb-6">
                          <div className="text-5xl font-bold text-[#EF6418] mb-2">
                            ${rentalPrice}
                          </div>
                          <p className="text-sm text-gray-400">24-hour rental</p>
                        </div>
                        <Button
                          onClick={handleRentClick}
                          disabled={rentingInProgress}
                          size="lg"
                          className="btn-primary font-bold px-12 py-6 text-lg"
                        >
                          {rentingInProgress ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Rent Now for ${rentalPrice}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-400">This film is not currently available for rental. Please check back later.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Synopsis */}
            {film.long_description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-[#EF6418]" />
                  <h2 className="text-2xl font-bold">Synopsis</h2>
                </div>
                <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                  {film.long_description}
                </p>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#EF6418]" />
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  {reviews && reviews.length > 0 && (
                    <span className="text-gray-400 text-sm">({reviews.length})</span>
                  )}
                </div>
                {user && !userReview && (
                  <Button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn-outline"
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {/* Write Review Form */}
              {user && showReviewForm && !userReview && (
                <Card className="bg-[#1A1A1A] border-[#333333] mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Write Your Review</h3>
                    <ReviewForm
                      filmId={film.id}
                      onSuccess={() => setShowReviewForm(false)}
                    />
                  </CardContent>
                </Card>
              )}

              {/* User's Existing Review */}
              {user && userReview && (
                <Card className="bg-[#1A1A1A] border-[#EF6418]/30 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Your Review</h3>
                      {!showReviewForm && (
                        <Button
                          onClick={() => setShowReviewForm(true)}
                          variant="ghost"
                          size="sm"
                          className="text-[#EF6418] hover:text-white hover:bg-[#EF6418] transition-colors"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    {showReviewForm ? (
                      <ReviewForm
                        filmId={film.id}
                        existingReview={userReview}
                        onSuccess={() => setShowReviewForm(false)}
                      />
                    ) : (
                      <div>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= userReview.rating
                                  ? "fill-[#EF6418] text-[#EF6418]"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        {userReview.review_text && (
                          <p className="text-gray-300">{userReview.review_text}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* All Reviews */}
              <ReviewList reviews={reviews} users={reviewUsers} />

              {/* Login Prompt for Non-Authenticated Users */}
              {!user && (
                <Card className="bg-[#1A1A1A] border-[#333333] mt-6">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-400 mb-4">Log in to write a review</p>
                    <Button
                      onClick={() => base44.auth.redirectToLogin(createPageUrl(`FilmDetail?slug=${slug}`))}
                      className="btn-primary"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333]"
            >
              <h3 className="text-xl font-bold mb-6">Film Details</h3>
              
              <div className="space-y-4">
                {reviews && reviews.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(calculateAverageRating())
                                ? "fill-[#EF6418] text-[#EF6418]"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold text-lg">{calculateAverageRating()}</span>
                      <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
                    </div>
                  </div>
                )}

                {film.genre && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Genre</p>
                    <p className="text-white font-medium">{film.genre}</p>
                  </div>
                )}
                
                {film.release_year && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Release Year</p>
                    <p className="text-white font-medium">{film.release_year}</p>
                  </div>
                )}
                
                {film.duration_minutes && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Duration</p>
                    <p className="text-white font-medium">{film.duration_minutes} minutes</p>
                  </div>
                )}
                
                {film.rating && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Rating</p>
                    <Badge className="bg-[#EF6418]/20 text-[#EF6418] border-0">
                      {film.rating}
                    </Badge>
                  </div>
                )}

                {rentalPrice && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Rental Price</p>
                    <p className="text-white font-bold text-2xl">${rentalPrice}</p>
                    <p className="text-gray-400 text-sm">24-hour access</p>
                  </div>
                )}
              </div>
            </motion.div>

            {hasActiveRental && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-[#EF6418]/10 to-[#D55514]/10 rounded-xl p-6 border border-[#EF6418]/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-[#EF6418]" />
                  <h3 className="text-lg font-bold">Active Rental</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  You have unlimited access to this film until your rental expires.
                </p>
                <div className="pt-3 border-t border-[#EF6418]/20">
                  <p className="text-xs text-gray-400 mb-1">Expires:</p>
                  <p className="text-sm font-medium text-[#EF6418]">
                    {formatExpirationTime(activeRental.expires_at)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}