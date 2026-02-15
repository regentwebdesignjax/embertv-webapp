import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, Play, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RentalSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [rental, setRental] = React.useState(null);
  const [film, setFilm] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    processRental();
  }, [location]);

  const processRental = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get("session_id");

      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      // Verify user is authenticated
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin(createPageUrl("Browse"));
        return;
      }

      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Find the rental by session ID
      const rentals = await base44.entities.FilmRental.filter({
        stripe_checkout_session_id: sessionId
      });

      if (rentals.length === 0) {
        setError("Rental not found. Please check 'My Rentals' or contact support if you were charged.");
        setLoading(false);
        return;
      }

      let rentalRecord = rentals[0];

      // Verify it belongs to this user
      if (rentalRecord.user_id !== user.id) {
        setError("Unauthorized access to this rental");
        setLoading(false);
        return;
      }

      // If webhook hasn't processed yet (rental still pending), activate it
      if (rentalRecord.status === "pending") {
        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt.getTime() + 24 * 60 * 60 * 1000);

        // Only update status and dates - preserve amount fields set by webhook
        await base44.entities.FilmRental.update(rentalRecord.id, {
          status: "active",
          purchased_at: purchasedAt.toISOString(),
          expires_at: expiresAt.toISOString()
        });

        // Refetch to get the complete updated record including amounts from webhook
        const updatedRentals = await base44.entities.FilmRental.filter({
          stripe_checkout_session_id: sessionId
        });
        rentalRecord = updatedRentals[0];
      }

      // Get film details
      const films = await base44.entities.Film.filter({ id: rentalRecord.film_id });
      if (films.length > 0) {
        setFilm(films[0]);
      }

      setRental(rentalRecord);
      setLoading(false);

    } catch (error) {
      console.error("Error processing rental:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatExpirationTime = (expiresAt) => {
    const date = new Date(expiresAt);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418] mb-4"></div>
        <p className="text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Confirming your purchase...
        </p>
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-4">Something Went Wrong</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <div className="flex gap-4">
          <Link to={createPageUrl("MyRentals")}>
            <Button className="btn-primary">
              Check My Rentals
            </Button>
          </Link>
          <Link to={createPageUrl("Browse")}>
            <Button className="btn-secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <Card className="bg-[#1A1A1A] border-[#333333] shadow-2xl">
            <CardContent className="p-8 sm:p-12 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#EF6418]/30">
                <CheckCircle className="w-12 h-12 text-[#EF6418]" />
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#F4EDE5]">
                Rental Successful!
              </h1>

              {/* Subheading */}
              <p className="text-lg text-[#F4EDE5]/80 mb-8">
                You now have 24-hour access to watch
              </p>

              {film &&
              <>
                  {/* Film Card */}
                  <div className="bg-[#0A0A0A] rounded-xl p-6 mb-8 border border-[#333333]">
                    {/* Film Title */}
                    <h2 className="text-2xl font-semibold mb-5 text-[#F4EDE5] leading-snug">
                      {film.title}
                    </h2>
                    
                    {/* Film Poster */}
                    {film.thumbnail_url &&
                      <img
                        src={film.thumbnail_url}
                        alt={film.title}
                        className="w-full max-w-xs mx-auto rounded-lg mb-5 shadow-lg" />
                    }
                    
                    {/* Expiration Info */}
                    <div className="space-y-2 pt-4 border-t border-[#333333]">
                      <div className="text-sm text-[#F4EDE5]/60">Your rental expires:</div>
                      <div className="text-lg font-semibold text-[#EF6418]">
                        {formatExpirationTime(rental.expires_at)}
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                      <Button
                        size="lg"
                        className="btn-primary font-bold px-8 w-full sm:w-auto">
                        <Play className="w-5 h-5 mr-2" />
                        Watch Now
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Browse")}>
                      <Button
                        size="lg"
                        className="btn-secondary w-full sm:w-auto">
                        Browse More Films
                      </Button>
                    </Link>
                  </div>
                </>
              }
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </motion.div>
      </div>
    </div>);

}