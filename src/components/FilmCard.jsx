import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function FilmCard({ film, index }) {
  return (
    <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group relative cursor-pointer h-full"
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1F1F1F] border border-[#333333] group-hover:border-[#EF6418] transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-[#EF6418]/20">
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="w-14 h-14 bg-[#EF6418] rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <h3 className="font-semibold text-white text-sm group-hover:text-[#EF6418] transition-colors line-clamp-2">
            {film.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {film.release_year && <span>{film.release_year}</span>}
            {film.genre && (
              <>
                {film.release_year && <span>•</span>}
                <span className="line-clamp-1">{film.genre}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}