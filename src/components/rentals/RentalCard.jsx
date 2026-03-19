import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Play, Film as FilmIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RentalCountdown from "../RentalCountdown";

export default function RentalCard({ rental, film, index, isExpired }) {
  if (!film) return null;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <Link
      to={createPageUrl(`FilmDetail?slug=${film.slug}`)}
      title={film.title}
      className={`flex flex-col gap-3 group ${isExpired ? 'opacity-60' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.05 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden block transition-all duration-300 z-10 hover:z-50 bg-[#1A1A1A] ${
          isExpired
            ? 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            : 'hover:shadow-[0_0_30px_rgba(239,100,24,0.4)]'
        }`}
      >
        {film.thumbnail_url ? (
          <img
            src={film.thumbnail_url}
            alt={film.title}
            className={`w-full h-full object-cover ${isExpired ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FilmIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className={`w-14 h-14 ${isExpired ? 'bg-gray-500' : 'bg-[#EF6418]'} rounded-full flex items-center justify-center shadow-lg`}>
              <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
          {!isExpired && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
          {isExpired ? 'Expired' : 'Active'}
        </Badge>
      </motion.div>

      {/* Countdown / Expiry below the poster */}
      <div className="px-1 text-xs text-gray-400">
        {isExpired ? (
          <span>Expired {new Date(rental.expires_at).toLocaleDateString()}</span>
        ) : (
          <RentalCountdown expiresAt={rental.expires_at} />
        )}
      </div>
    </Link>
  );
}