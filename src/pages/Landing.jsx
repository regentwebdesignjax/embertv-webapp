import React from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Film, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import FilmCard from "../components/FilmCard";

export default function Landing() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const { data: featuredFilms, isLoading: filmsLoading } = useQuery({
    queryKey: ['featured-films'],
    queryFn: async () => {
      const films = await base44.entities.Film.filter({
        is_published: true,
        is_featured: true
      }, '-created_date');
      return films;
    },
    initialData: []
  });

  const handleGetStarted = () => {
    if (user) {
      window.location.href = createPageUrl("Browse");
    } else {
      base44.auth.redirectToLogin(createPageUrl("Browse"));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/050617f34_ember-bg-movie.jpg"
            alt="Hero"
            className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl">

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Rent Catholic films. <span className="text-[#FF6B1A]">Anytime. Anywhere.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed">
              Discover a growing library of faith-filled movies and rent each title on-demand — no subscriptions, no commitments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="btn-primary text-lg px-8 py-6">
                <Film className="w-5 h-5 mr-2" />
                Browse Films
              </Button>
              {!user &&
              <Button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Browse"))}
                size="lg"
                className="btn-secondary text-lg px-8 py-6">
                  Sign Up
                </Button>
              }
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">

          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full" />

          </div>
        </motion.div>
      </section>

      {/* Featured Films Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>

            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-[#FF6B1A]" />
              <h2 className="text-3xl sm:text-4xl font-bold">Featured Films</h2>
            </div>
            <p className="text-gray-400 mb-12 text-lg">
              A preview of our inspiring collection
            </p>
          </motion.div>

          {filmsLoading ?
          <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B1A]"></div>
            </div> :
          featuredFilms.length === 0 ?
          <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No featured films available yet</p>
            </div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredFilms.slice(0, 4).map((film, index) =>
            <FilmCard key={film.id} film={film} index={index} showPrice={false} />
            )}
            </div>
          }

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center">

            <Button
              onClick={handleGetStarted}
              size="lg"
              className="btn-secondary text-lg px-8 py-6">
              <Film className="w-5 h-5 mr-2" />
              View Full Catalog
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start streaming inspiring content in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
            {
              step: "01",
              icon: Film,
              title: "Browse",
              description: "Explore Catholic films from a variety of genres."
            },
            {
              step: "02",
              icon: Play,
              title: "Watch the Trailer",
              description: "Every film comes with a free preview so you can decide before renting."
            },
            {
              step: "03",
              icon: CheckCircle,
              title: "Rent & Enjoy for 24 Hours",
              description: "Pay only for the films you want. Once rented, watch instantly for the next 24 hours."
            }].
            map((item, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative">

                <div className="bg-[#000000] border border-[#333333] rounded-2xl p-8 hover:border-[#FF6B1A]/50 transition-all duration-300 h-full">
                  <div className="text-6xl font-bold text-[#FF6B1A]/20 mb-4">{item.step}</div>
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B1A] to-[#E55E15] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-[#FF6B1A]/20">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 &&
              <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 w-12 h-0.5 bg-gradient-to-r from-[#FF6B1A] to-transparent" />
              }
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#000000] to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center">

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Join Ember to access your favorite Catholic films on-demand.

          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">Discover inspiring films that uplift, encourage, and celebrate faith.


          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="btn-primary text-xl px-12 py-7 font-bold">
            <Play className="w-6 h-6 mr-3" />
            {user ? "Browse Film Catalog" : "Sign Up Now"}
          </Button>
        </motion.div>
      </section>
    </div>);

}