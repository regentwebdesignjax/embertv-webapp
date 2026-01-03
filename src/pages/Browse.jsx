import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, Sparkles, TrendingUp, Clock, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilmCard from "../components/FilmCard";
import { useLocation } from "react-router-dom";

export default function Browse() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
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

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ['published-films'],
    queryFn: async () => {
      const allFilms = await base44.entities.Film.filter({ is_published: true }, '-created_date');
      return allFilms;
    },
    initialData: [],
  });

  const featuredFilms = films.filter(f => f.is_featured);
  const newReleases = films.filter(f => f.is_new_release);
  const trendingFilms = films.filter(f => f.is_trending);
  const leavingSoon = films.filter(f => f.is_leaving_soon);
  const genres = ["all", ...new Set(films.filter(f => f.genre).map(f => f.genre))];

  const filteredFilms = films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         film.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === "all" || film.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

  // Group films by genre for category rows
  const filmsByGenre = {};
  filteredFilms.forEach(film => {
    const genre = film.genre || 'Uncategorized';
    if (!filmsByGenre[genre]) {
      filmsByGenre[genre] = [];
    }
    filmsByGenre[genre].push(film);
  });

  const genreCategories = Object.keys(filmsByGenre).sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF6B1A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] pb-20">
      {/* Hero Banner */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/2fac85c0f_embertv-browse-header.jpg"
            alt="Browse"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/70 to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {user ? (
                <>Welcome, <span className="text-[#FF6B1A]">{user.display_name || user.email}</span></>
              ) : (
                <>Discover <span className="text-[#FF6B1A]">Faith-Focused Films</span></>
              )}
            </h1>
            <p className="text-xl text-gray-300">
              Rent any film for 24-hour unlimited access
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-[#1F1F1F] border-[#333333] text-white placeholder:text-gray-500 h-12 focus:border-[#EF6418] focus:ring-[#EF6418]"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-48">
            <Filter className="w-5 h-5 text-gray-400" />
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="bg-[#1F1F1F] border-[#333333] text-white h-12 focus:border-[#EF6418] focus:ring-[#EF6418]">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-[#1F1F1F] border-[#333333] text-white">
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre} className="focus:bg-[#EF6418] focus:text-white">
                    {genre === "all" ? "All Genres" : genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {filmsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
          </div>
        ) : filteredFilms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">No films found matching your criteria</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            {/* Featured Films Row */}
            {featuredFilms.length > 0 && !searchQuery && genreFilter === "all" && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-[#EF6418]" />
                  <h2 className="text-2xl md:text-3xl font-bold">Featured Rentals</h2>
                </div>
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {featuredFilms.map((film, index) => (
                      <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
                        <FilmCard film={film} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* New Releases Row */}
            {newReleases.length > 0 && !searchQuery && genreFilter === "all" && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Flame className="w-6 h-6 text-[#EF6418]" />
                  <h2 className="text-2xl md:text-3xl font-bold">New Releases</h2>
                </div>
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {newReleases.map((film, index) => (
                      <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
                        <FilmCard film={film} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Trending Now Row */}
            {trendingFilms.length > 0 && !searchQuery && genreFilter === "all" && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-[#EF6418]" />
                  <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
                </div>
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {trendingFilms.map((film, index) => (
                      <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
                        <FilmCard film={film} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Leaving Soon Row */}
            {leavingSoon.length > 0 && !searchQuery && genreFilter === "all" && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-[#EF6418]" />
                  <h2 className="text-2xl md:text-3xl font-bold">Leaving Soon</h2>
                </div>
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {leavingSoon.map((film, index) => (
                      <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
                        <FilmCard film={film} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Category/Genre Rows */}
            {searchQuery || genreFilter !== "all" ? (
              // Search/Filter results in grid
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-6">
                  {filteredFilms.length} Films Found
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFilms.map((film, index) => (
                    <FilmCard key={film.id} film={film} index={index} />
                  ))}
                </div>
              </motion.section>
            ) : (
              // Category rows
              genreCategories.map((genre, sectionIndex) => (
                <motion.section
                  key={genre}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-6">{genre}</h2>
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                      {filmsByGenre[genre].map((film, index) => (
                        <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
                          <FilmCard film={film} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}