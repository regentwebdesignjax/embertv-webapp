import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function FilmCard({ film, index }) {
  return (
    <Link
      to={createPageUrl(`FilmDetail?slug=${film.slug}`)}
      title={film.title}
      className="relative aspect-[2/3] w-full rounded-xl overflow-hidden cursor-pointer block transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,100,24,0.4)] hover:z-50 group"
    >
      <motion.div
        layoutId={`poster-${film.id}`}
        layout="position"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="w-full h-full"
      >
        {film.thumbnail_url ? (
          <img
            src={film.thumbnail_url}
            alt={film.title}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F]">
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
      </motion.div>
    </Link>
  );
}