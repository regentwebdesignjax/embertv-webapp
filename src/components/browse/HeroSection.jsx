import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

function extractVideoSrc(embedCode) {
  if (!embedCode) return null;
  const match = embedCode.match(/src=["']([^"']+)["']/);
  if (!match) return null;
  let src = match[1];
  try {
    const url = new URL(src);
    if (src.includes('vimeo.com')) {
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('muted', '1');
      url.searchParams.set('background', '1');
      url.searchParams.set('loop', '1');
      url.searchParams.set('controls', '0');
      return url.toString();
    }
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      const videoId = url.pathname.split('/').pop();
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('mute', '1');
      url.searchParams.set('loop', '1');
      url.searchParams.set('controls', '0');
      url.searchParams.set('showinfo', '0');
      url.searchParams.set('rel', '0');
      url.searchParams.set('playlist', videoId);
      return url.toString();
    }
  } catch (e) {}
  return null;
}

export default function HeroSection({ film }) {
  const videoSrc = film ? extractVideoSrc(film.trailer_embed_code) : null;
  const bgImage = film?.banner_image_url || film?.thumbnail_url;
  const rentalPrice = film?.rental_price_cents
    ? `$${(film.rental_price_cents / 100).toFixed(2)}`
    : null;

  if (!film) {
    return (
      <div className="relative h-[60vh] bg-[#111] flex items-center justify-center">
        <p className="text-gray-500 text-lg">No featured films available</p>
      </div>
    );
  }

  return (
    <div className="relative h-[85vh] flex items-end overflow-hidden">
      {/* Background */}
      {videoSrc ? (
        <iframe
          src={videoSrc}
          allow="autoplay; fullscreen"
          frameBorder="0"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '177.78vh',
            height: '100vh',
            minWidth: '100%',
            minHeight: '100%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            pointerEvents: 'none',
          }}
        />
      ) : bgImage ? (
        <img
          src={bgImage}
          alt={film.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#111]" />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">{film.title}</h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-4">
            {film.release_year && <span>{film.release_year}</span>}
            {film.genre && (
              <><span className="text-gray-600">•</span><span>{film.genre}</span></>
            )}
            {film.duration_minutes && (
              <><span className="text-gray-600">•</span><span>{film.duration_minutes} min</span></>
            )}
            {film.rating && (
              <>
                <span className="text-gray-600">•</span>
                <span className="border border-gray-500 px-1.5 py-0.5 rounded text-xs text-gray-300">
                  {film.rating}
                </span>
              </>
            )}
          </div>

          {film.short_description && (
            <p className="text-gray-300 text-lg leading-relaxed mb-8 line-clamp-3">
              {film.short_description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
              <Button size="lg" className="btn-primary font-bold px-8">
                <Play className="w-5 h-5 mr-2" />
                {rentalPrice ? `Rent for ${rentalPrice}` : 'Watch Now'}
              </Button>
            </Link>
            <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8"
              >
                <Info className="w-4 h-4 mr-2" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}