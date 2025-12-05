import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Play, Film as FilmIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RentalCard({ rental, film, index, isExpired }) {
  if (!film) return null;

  return (
    <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className={`group relative cursor-pointer h-full ${isExpired ? 'opacity-60' : ''}`}
      >
        <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1F1F1F] border transition-all duration-300 ${
          isExpired 
            ? 'border-[#333333] group-hover:border-gray-500' 
            : 'border-[#EF6418]/30 group-hover:border-[#EF6418] group-hover:shadow-2xl group-hover:shadow-[#EF6418]/20'
        }`}>
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className={`w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110 ${
                isExpired ? 'grayscale' : ''
              }`}
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
          <Badge className={`absolute top-3 right-3 ${
            isExpired 
              ? 'bg-gray-600 text-white' 
              : 'bg-[#EF6418] text-white'
          } border-0`}>
            {isExpired ? 'Expired' : 'Active'}
          </Badge>
        </div>

        <div className="mt-2 space-y-1">
          <h3 className={`font-semibold text-sm transition-colors line-clamp-2 ${
            isExpired 
              ? 'text-gray-400' 
              : 'text-white group-hover:text-[#EF6418]'
          }`}>
            {film.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {isExpired ? (
              <span>Expired {new Date(rental.expires_at).toLocaleDateString()}</span>
            ) : (
              <span>Expires {new Date(rental.expires_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}