import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import FilmCard from "../components/FilmCard";
import { Skeleton } from "@/components/ui/skeleton";

const FilmCardSkeleton = () => (
  <div className="flex-none w-[38%] sm:w-[28%] md:w-[20%] lg:w-[15%] xl:w-[13.5%] space-y-3">
    <Skeleton className="w-full aspect-[2/3] rounded-lg bg-white/5" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4 bg-white/5" />
      <Skeleton className="h-3 w-1/2 bg-white/5" />
    </div>
  </div>
);
import HeroCarousel from "../components/HeroCarousel";
import { useLocation } from "react-router-dom";

export default function Browse() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [genreFilter, setGenreFilter] = React.useState("all");
  const location = useLocation();

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

  React.useEffect(() => {
    checkAuth();
  }, [location]);

  const { data: userRentals } = useQuery({
    queryKey: ['user-rentals', user?.id],
    queryFn: () => base44.entities.FilmRental.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user,
    initialData: [],
  });

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ['published-films'],
    queryFn: async () => {
      const allFilms = await base44.entities.Film.filter({ is_published: true }, '-created_date');
      return allFilms;
    },
    initialData: [],
  });

  const featuredFilms = films
    .filter(f => f.is_featured)
    .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999));
  const newReleases = films.filter(f => f.is_new_release);
  const trendingFilms = films.filter(f => f.is_trending);
  const leavingSoon = films.filter(f => f.is_leaving_soon);
  const genres = ["all", ...new Set(films.filter(f => f.genre).map(f => f.genre))];

  const filteredFilms = genreFilter === "all"
    ? films
    : films.filter(film => film.genre === genreFilter);

  const filmsByGenre = {};
  filteredFilms.forEach(film => {
    const genre = film.genre || 'Uncategorized';
    if (!filmsByGenre[genre]) filmsByGenre[genre] = [];
    filmsByGenre[genre].push(film);
  });
  const genreCategories = Object.keys(filmsByGenre).sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] pb-20">
      {/* Cinematic Hero Carousel */}
      <HeroCarousel featuredFilms={featuredFilms} userRentals={userRentals} user={user} />

      {/* Pill Genre Navigation */}
      <div className="sticky top-16 sm:top-20 z-30 bg-gradient-to-b from-black to-transparent pt-4 pb-4">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-4 pt-2 scrollbar-hide w-full snap-x px-4 md:px-8 lg:px-12">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setGenreFilter(genre)}
              className={`flex-none snap-start px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                genreFilter === genre
                  ? 'bg-[#EF6418] text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {genre === "all" ? "All" : genre}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rows */}
      <div className="w-full mt-8">
        {filmsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
          </div>
        ) : genreFilter !== "all" ? (
          // Filtered genre grid
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="py-6 px-4 md:px-12 lg:px-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{genreFilter}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {filteredFilms.map((film, index) => (
                <FilmCard key={film.id} film={film} index={index} />
              ))}
            </div>
          </motion.section>
        ) : (
          <div className="space-y-16">
            {/* New Releases */}
            {newReleases.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-6 px-4 md:px-12 lg:px-16">New Releases</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full px-4 md:px-12 lg:px-16">
                  {newReleases.map((film, index) => (
                    <div key={film.id} className="flex-none w-[38%] sm:w-[28%] md:w-[20%] lg:w-[15%] xl:w-[13.5%] snap-start">
                      <FilmCard film={film} index={index} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Trending Now */}
            {trendingFilms.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-6 px-4 md:px-12 lg:px-16">Trending Now</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full px-4 md:px-12 lg:px-16">
                  {trendingFilms.map((film, index) => (
                    <div key={film.id} className="flex-none w-[38%] sm:w-[28%] md:w-[20%] lg:w-[15%] xl:w-[13.5%] snap-start">
                      <FilmCard film={film} index={index} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Leaving Soon */}
            {leavingSoon.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-6 px-4 md:px-12 lg:px-16">Leaving Soon</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full px-4 md:px-12 lg:px-16">
                  {leavingSoon.map((film, index) => (
                    <div key={film.id} className="flex-none w-[38%] sm:w-[28%] md:w-[20%] lg:w-[15%] xl:w-[13.5%] snap-start">
                      <FilmCard film={film} index={index} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Genre Rows */}
            {genreCategories.map((genre, sectionIndex) => (
              <motion.section
                key={genre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.08 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-6 px-4 md:px-12 lg:px-16">{genre}</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full px-4 md:px-12 lg:px-16">
                  {filmsByGenre[genre].map((film, index) => (
                    <div key={film.id} className="flex-none w-[38%] sm:w-[28%] md:w-[20%] lg:w-[15%] xl:w-[13.5%] snap-start">
                      <FilmCard film={film} index={index} />
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}

            {films.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No films available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}