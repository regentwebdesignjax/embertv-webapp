import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
// Keep import for now, though Card/CardContent are removed from JSX

export default function RentalCanceled() {
  const location = useLocation();
  const [filmSlug, setFilmSlug] = React.useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const slug = urlParams.get("film_slug");
    setFilmSlug(slug);
  }, [location]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center">

        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#F4EDE5]">
          Rental Canceled
        </h1>

        {/* Subheading */}
        <p className="text-lg text-[#F4EDE5]/80 mb-8">
          Your rental was not completed. No charges have been made to your account.
        </p>

        {/* Info Card */}
        <div className="bg-[#0A0A0A] rounded-xl p-6 mb-8 border border-[#333333]">
          <p className="text-[#F4EDE5]/60 text-sm">
            If you experienced any issues during checkout, please contact our support team.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {filmSlug &&
            <Link to={createPageUrl(`FilmDetail?slug=${filmSlug}`)}>
              <Button className="btn-primary font-semibold px-6 w-full sm:w-auto">
                Try Again
              </Button>
            </Link>
          }
          <Link to={createPageUrl("Browse")}>
            <Button className="btn-secondary w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>);

}