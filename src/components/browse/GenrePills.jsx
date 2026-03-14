import React from "react";

export default function GenrePills({ genres, activeGenre, onSelect }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelect(genre)}
            className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeGenre === genre
                ? "bg-[#EF6418] text-white"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {genre === "all" ? "All" : genre}
          </button>
        ))}
      </div>
    </div>
  );
}