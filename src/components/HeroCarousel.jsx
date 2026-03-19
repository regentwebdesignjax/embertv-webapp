import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Play, Info, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { base44 } from "@/api/base44Client";

const SLIDE_DURATION = 8000;

export default function HeroCarousel({ featuredFilms, userRentals = [], user }) {
  const navigate = useNavigate();
  const [loadingFilmId, setLoadingFilmId] = React.useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = React.useState(null);

  const hasActiveRental = (filmId) => {
    const now = new Date();
    return userRentals.some(r => r.film_id === filmId && new Date(r.expires_at) > now);
  };

  const handleRentNow = async (film) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setLoadingFilmId(film.id);
    try {
      const response = await base44.functions.invoke('createRentalCheckout', { film_id: film.id });
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingFilmId(null);
    }
  };
  const [api, setApi] = React.useState(null);
  const [current, setCurrent] = React.useState(0);
  const [progressKey, setProgressKey] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setProgressKey(k => k + 1);
    };
    api.on('select', onSelect);
    return () => api.off('select', onSelect);
  }, [api]);

  React.useEffect(() => {
    if (!api || featuredFilms.length <= 1) return;
    const timer = setTimeout(() => {
      api.scrollNext();
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [api, current, progressKey, featuredFilms.length]);

  if (featuredFilms.length === 0) {
    const displayName = user?.display_name || user?.full_name || null;
    return (
      <section className="relative h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/2fac85c0f_embertv-browse-header.jpg"
            alt="EmberTV"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        <div className="relative z-10 w-full px-4 md:px-12 lg:px-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-3 leading-tight">
            {displayName ? (
              <>Welcome, <span className="text-[#EF6418]">{displayName}</span></>
            ) : (
              'Welcome'
            )}
          </h1>
          <p className="text-xl text-gray-300">Rent any film for 48-hour unlimited access</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {featuredFilms.map((film) => {
            const bgImage = film.banner_image_url || film.thumbnail_url;

            return (
              <CarouselItem key={film.id}>
                <div className="relative h-[82vh] flex items-end overflow-hidden">
                  {/* Background */}
                  {bgImage ? (
                    <div className="absolute inset-0">
                      <img src={bgImage} alt={film.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-[#1A1A1A]" />
                  )}

                  {/* Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent md:w-2/3" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/20 to-transparent h-full" />

                  {/* Content */}
                  <div className="relative z-10 w-full px-4 md:px-12 lg:px-16 pb-24">
                    <div className="max-w-2xl">
                      <motion.h1
                        key={film.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl md:text-7xl font-bold mb-3 leading-tight drop-shadow-lg"
                      >
                        {film.title}
                      </motion.h1>

                      <motion.div
                        key={`meta-${film.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap"
                      >
                        {film.release_year && <span>{film.release_year}</span>}
                        {film.genre && <><span className="text-gray-600">•</span><span>{film.genre}</span></>}
                        {film.duration_minutes && <><span className="text-gray-600">•</span><span>{film.duration_minutes}m</span></>}
                        {film.rating && <><span className="text-gray-600">•</span><span className="border border-gray-600 px-1.5 py-0.5 text-xs rounded">{film.rating}</span></>}
                      </motion.div>

                      {film.short_description && (
                        <motion.p
                          key={`desc-${film.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.25 }}
                          className="text-gray-300 text-base mb-6 line-clamp-2 max-w-lg drop-shadow-md"
                        >
                          {film.short_description}
                        </motion.p>
                      )}

                      <motion.div
                        key={`cta-${film.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        className="flex items-center gap-3"
                      >
                        {hasActiveRental(film.id) ? (
                          <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                            <Button className="btn-primary gap-2 px-6 h-11">
                              <Play className="w-4 h-4 fill-white" />
                              Watch Now
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            className="btn-primary gap-2 px-6 h-11"
                            onClick={() => handleRentNow(film)}
                            disabled={loadingFilmId === film.id}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {loadingFilmId === film.id ? 'Loading...' : 'Rent Now'}
                          </Button>
                        )}
                        <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                          <Button className="btn-secondary gap-2 px-6 h-11">
                            <Info className="w-4 h-4" />
                            More Info
                          </Button>
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Timed Pagination Dots */}
      {featuredFilms.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {featuredFilms.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 overflow-hidden relative ${
                i === current ? 'w-8 bg-white/30' : 'w-2 bg-white/30'
              }`}
            >
              {i === current && (
                <motion.div
                  key={progressKey}
                  className="absolute inset-y-0 left-0 bg-white rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}