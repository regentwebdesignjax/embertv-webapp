import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Film, Clock, Play, Sparkles, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RentalCard from "../components/rentals/RentalCard";
import RentalListView from "../components/rentals/RentalListView";

export default function MyRentals() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState(() => {
    return localStorage.getItem('rentals-view-mode') || 'card';
  });

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl("MyRentals"));
    }
  };

  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['my-rentals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.FilmRental.filter(
        { user_id: user.id },
        '-created_date'
      );
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  const { data: films } = useQuery({
    queryKey: ['films-for-rentals'],
    queryFn: async () => {
      return await base44.entities.Film.list();
    },
    initialData: []
  });

  const getFilmForRental = (rental) => {
    return films.find((f) => f.id === rental.film_id);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rentals-view-mode', mode);
  };

  const activeRentals = rentals?.filter((r) => {
    if (r.status !== "active") return false;
    const now = new Date();
    const expiresAt = new Date(r.expires_at);
    return now < expiresAt;
  }) || [];

  const expiredRentals = rentals?.filter((r) => {
    if (r.status === "expired") return true;
    if (r.status === "active") {
      const now = new Date();
      const expiresAt = new Date(r.expires_at);
      return now >= expiresAt;
    }
    return false;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <h1 className="text-4xl font-bold">My Rentals</h1>
          
          {/* View Toggle */}
          <div className="flex gap-2 bg-[#1A1A1A] border border-[#333333] rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('card')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'card'
                  ? 'bg-[#EF6418] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-sm font-medium">Card View</span>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-[#EF6418] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">List View</span>
            </button>
          </div>
        </motion.div>

        {rentalsLoading ?
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
          </div> :

        <div className="space-y-12 mt-8">
            {/* Active Rentals */}
            <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12">

              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#FF6B1A]" />
                Active Rentals
              </h2>

              {activeRentals.length === 0 ? (
                <Card className="bg-[#1A1A1A] border-[#333333] p-12 text-center">
                  <CardContent>
                    <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-[#ffffff] mb-2 text-xl font-semibold">No Active Rentals</h3>
                    <p className="text-gray-400 mb-6">
                      Browse our catalog and rent a film to start watching
                    </p>
                    <Link to={createPageUrl("Browse")}>
                      <Button className="btn-primary">
                        <Play className="w-4 h-4 mr-2" />
                        Browse Films
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : viewMode === 'card' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {activeRentals.map((rental, index) => (
                    <RentalCard
                      key={rental.id}
                      rental={rental}
                      film={getFilmForRental(rental)}
                      index={index}
                      isExpired={false}
                    />
                  ))}
                </div>
              ) : (
                <RentalListView
                  rentals={activeRentals}
                  films={films}
                  getFilmForRental={getFilmForRental}
                />
              )}
            </motion.section>

            {/* Expired Rentals */}
            {expiredRentals.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-gray-400" />
                  Expired Rentals
                </h2>

                {viewMode === 'card' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {expiredRentals.map((rental, index) => (
                      <RentalCard
                        key={rental.id}
                        rental={rental}
                        film={getFilmForRental(rental)}
                        index={index}
                        isExpired={true}
                      />
                    ))}
                  </div>
                ) : (
                  <RentalListView
                    rentals={expiredRentals}
                    films={films}
                    getFilmForRental={getFilmForRental}
                  />
                )}
              </motion.section>
            )}
          </div>
        }
      </div>
    </div>);

}