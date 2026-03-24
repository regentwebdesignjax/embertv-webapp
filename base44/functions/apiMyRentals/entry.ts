// apiMyRentals – return ONLY ACTIVE, non-expired rentals for the
// currently logged-in user (based on our Ember JWT from authLogin).

import { jwtVerify } from "npm:jose@5.2.0";

// ---- Config ----

const SERVER_URL =
  Deno.env.get("BASE44_SERVER_URL") || "https://app.base44.com";
const APP_ID = Deno.env.get("BASE44_APP_ID") || "";
const API_KEY =
  Deno.env.get("BASE44_API_KEY") ||
  Deno.env.get("BASE44_SERVICE_ROLE_KEY") ||
  "";

const JWT_SECRET = new TextEncoder().encode(Deno.env.get("API_JWT_SECRET"));

// ---- Helpers ----

function apiUrl(path) {
  return `${SERVER_URL}/api/apps/${APP_ID}${path}`;
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

async function base44Get(path) {
  const res = await fetch(apiUrl(path), {
    method: "GET",
    headers: {
      api_key: API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Base44 GET ${path} failed: ${res.status} - ${body}`);
  }

  return res.json();
}

async function base44Put(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: {
      api_key: API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Base44 PUT ${path} failed: ${res.status}`);
  }

  return res.json();
}

// ---- Main handler ----

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch (err) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const userId = payload.userId;
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const rentals = await base44Get(`/entities/FilmRental`);
    const now = new Date();

    // Force string comparison just in case database IDs are Ints but Token is a String
    const userRentals = rentals.filter((rental) => String(rental.user_id) === String(userId));
    const activeRentalsForUser = [];

    for (const rental of userRentals) {
      if (rental.status === "active") {
        if (rental.expires_at && new Date(rental.expires_at) <= now) {
          await base44Put(`/entities/FilmRental/${rental.id}`, { status: "expired" });
        } else {
          activeRentalsForUser.push(rental);
        }
      }
    }

    if (!activeRentalsForUser.length) {
      return Response.json({ data: [] }, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
    }

    const filmIds = [...new Set(activeRentalsForUser.map((r) => r.film_id))];
    const filmsMap = {};

    // 🛠️ FIX: Wrap in a try/catch so a deleted film doesn't crash the entire API
    for (const filmId of filmIds) {
      try {
        const film = await base44Get(`/entities/Film/${filmId}`);
        filmsMap[film.id] = film;
      } catch (err) {
        console.warn(`⚠️ Skipping missing film ID: ${filmId}`);
      }
    }

    const rentalData = activeRentalsForUser.map((rental) => {
      const film = filmsMap[rental.film_id];
      if (!film) return null; // Drop rental if film no longer exists

      return {
        film: {
          id: film.id,
          slug: film.slug,
          title: film.title,
          short_description: film.short_description,
          // 🛠️ FIX: Convert empty strings to null so Swift doesn't crash on invalid URLs
          poster_url: film.thumbnail_url || null,
          hls_url: film.hls_playback_url || null,
        },
        status: rental.status,
        purchased_at: rental.purchased_at ?? rental.created_date,
        expires_at: rental.expires_at,
      };
    }).filter(r => r !== null); // Remove nulls

    return Response.json({ data: rentalData }, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });

  } catch (error) {
    console.error("My rentals API error:", error);
    return Response.json({ error: "Failed to fetch rentals" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});