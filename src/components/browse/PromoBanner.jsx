import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PromoBanner({ film }) {
  const bgImage = film.banner_image_url || film.thumbnail_url;
  const rentalPrice = film.rental_price_cents
    ? `$${(film.rental_price_cents / 100).toFixed(2)}`
    : null;

  return (
    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
      {bgImage && (
        <img
          src={bgImage}
          alt={film.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-[#EF6418] text-xs font-semibold uppercase tracking-widest mb-2">
          Featured Film
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-3">{film.title}</h2>
        {film.short_description && (
          <p className="text-gray-300 text-sm mb-6 max-w-md line-clamp-2">
            {film.short_description}
          </p>
        )}
        <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
          <Button className="btn-primary font-semibold px-8">
            <Play className="w-4 h-4 mr-2" />
            {rentalPrice ? `Rent for ${rentalPrice}` : "Watch Now"}
          </Button>
        </Link>
      </div>
    </div>
  );
}