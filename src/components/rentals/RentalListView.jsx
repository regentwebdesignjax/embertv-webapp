import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Film as FilmIcon } from "lucide-react";
import { format } from "date-fns";

export default function RentalListView({ rentals, films, getFilmForRental }) {
  return (
    <div className="space-y-3">
      {rentals.map((rental) => {
        const film = getFilmForRental(rental);
        if (!film) return null;

        const isExpired = rental.status === "expired" || 
          (rental.status === "active" && new Date() >= new Date(rental.expires_at));

        return (
          <div
            key={rental.id}
            className={`bg-[#1A1A1A] border rounded-lg overflow-hidden transition-all duration-300 hover:border-[#EF6418] ${
              isExpired ? 'border-[#333333] opacity-75' : 'border-[#EF6418]/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              {/* Thumbnail */}
              <Link 
                to={createPageUrl(`FilmDetail?slug=${film.slug}`)}
                className="flex-shrink-0"
              >
                <div className="w-full sm:w-24 aspect-[2/3] rounded overflow-hidden bg-[#1F1F1F]">
                  {film.thumbnail_url ? (
                    <img
                      src={film.thumbnail_url}
                      alt={film.title}
                      className={`w-full h-full object-cover ${isExpired ? 'grayscale' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FilmIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                    <h3 className={`text-lg font-semibold mb-1 hover:text-[#EF6418] transition-colors ${
                      isExpired ? 'text-gray-400' : 'text-white'
                    }`}>
                      {film.title}
                    </h3>
                  </Link>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-2">
                    {film.release_year && <span>{film.release_year}</span>}
                    {film.genre && (
                      <>
                        {film.release_year && <span>•</span>}
                        <span>{film.genre}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge className={`${
                      isExpired 
                        ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' 
                        : 'bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/30'
                    }`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </Badge>
                    
                    {rental.purchased_at && (
                      <span className="text-gray-500 text-xs">
                        Rented: {format(new Date(rental.purchased_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    
                    {rental.expires_at && (
                      <span className="text-gray-500 text-xs">
                        {isExpired ? 'Expired' : 'Expires'}: {format(new Date(rental.expires_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                    {isExpired ? (
                      <Button 
                        size="sm"
                        className="btn-outline"
                      >
                        Rent Again
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        className="btn-primary"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Watch Now
                      </Button>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}