import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import FilmCard from "../components/FilmCard";
import HeroSection from "../components/browse/HeroSection";
import GenrePills from "../components/browse/GenrePills";
import PromoBanner from "../components/browse/PromoBanner";

export default function Browse() {
  const [genreFilter, setGenreFilter] = React.useState("all");
  const location = useLocation();

  const { data: films, isLoading } = useQuery({
    queryKey: ['published-films'],
    queryFn: () => base44.entities.Film.filter({ is_published: true }, '-created_date'),
    initialData: [],
  });

  const featuredFilms = films.filter(f => f.is_featured);
  const newReleases = films.filter(f => f.is_new_release);
  const trendingFilms = films.filter(f => f.is_trending);
  const leavingSoon = films.filter(f => f.is_leaving_soon);

  const genres = ["all", ...new Set(films.filter(f => f.genre).map(f => f.genre))];

  const filteredFilms = genreFilter === "all"
    ? films
    : films.filter(f => f.genre === genreFilter);

  // Group by genre for category rows
  const filmsByGenre = {};
  filteredFilms.forEach(film => {
    const genre = film.genre || "Uncategorized";
    if (!filmsByGenre[genre]) filmsByGenre[genre] = [];
    filmsByGenre[genre].push(film);
  });
  const genreCategories = Object.keys(filmsByGenre).sort();

  // Promo banner film: featuredFilms[1] or first trending film
  const promoBannerFilm = featuredFilms[1] || trendingFilms[0] || null;

  const FilmRow = ({ title, films: rowFilms }) => (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {rowFilms.map((film, index) => (
          <div key={film.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] snap-start">
            <FilmCard film={film} index={index} />
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#000000] pb-20">
      {/* Cinematic Hero */}
      <HeroSection film={featuredFilms[0] || null} />

      {/* Genre Pills */}
      <GenrePills genres={genres} activeGenre={genreFilter} onSelect={setGenreFilter} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {genreFilter !== "all" ? (
            // Filtered results
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">
                {filteredFilms.length} Film{filteredFilms.length !== 1 ? 's' : ''} in {genreFilter}
              </h2>
              {filteredFilms.length === 0 ? (
                <p className="text-gray-500">No films found in this genre.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFilms.map((film, index) => (
                    <FilmCard key={film.id} film={film} index={index} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Featured Row */}
              {featuredFilms.length > 0 && (
                <FilmRow title="Featured Rentals" films={featuredFilms} />
              )}

              {/* New Releases Row */}
              {newReleases.length > 0 && (
                <FilmRow title="New Releases" films={newReleases} />
              )}

              {/* Trending Row */}
              {trendingFilms.length > 0 && (
                <FilmRow title="Trending Now" films={trendingFilms} />
              )}

              {/* Promo Banner — inserted between Trending and Leaving Soon */}
              {promoBannerFilm && (
                <div className="py-6">
                  <PromoBanner film={promoBannerFilm} />
                </div>
              )}

              {/* Leaving Soon Row */}
              {leavingSoon.length > 0 && (
                <FilmRow title="Leaving Soon" films={leavingSoon} />
              )}

              {/* Genre Rows */}
              {genreCategories.map((genre) => (
                <FilmRow key={genre} title={genre} films={filmsByGenre[genre]} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}