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

// This must match API_JWT_SECRET used in authLogin
const JWT_SECRET = new TextEncoder().encode(Deno.env.get("API_JWT_SECRET"));

// ---- Helpers ----

function apiUrl(path) {
  return `${SERVER_URL}/api/apps/${APP_ID}${path}`;
}

// Verify our Ember JWT (issued in authLogin)
async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  // authLogin generates tokens with { userId, email }
  return payload;
}

// Base44 GET
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
    console.error(`Base44 GET ${path} failed:`, res.status, body);
    throw new Error(`Base44 GET ${path} failed: ${res.status}`);
  }

  return res.json();
}

// Base44 PUT
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
    const text = await res.text();
    console.error(`Base44 PUT ${path} failed:`, res.status, text);
    throw new Error(`Base44 PUT ${path} failed: ${res.status}`);
  }

  return res.json();
}

// ---- Main handler ----

Deno.serve(async (req) => {
  // CORS preflight
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

  // Only GET allowed
  if (req.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  if (!APP_ID || !API_KEY) {
    return Response.json(
      { error: "Server misconfigured" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  try {
    // 1) Extract and verify the Ember JWT
    const authHeader = req.headers.get("Authorization") || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return Response.json(
        { error: "unauthorized", message: "Missing bearer token" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch (err) {
      return Response.json(
        { error: "unauthorized", message: "Invalid or expired token" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const userId = payload.userId;
    if (!userId) {
      return Response.json(
        { error: "unauthorized", message: "Token missing userId" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 2) Fetch rentals
    const rentals = await base44Get(`/entities/FilmRental`);
    const now = new Date();

    // 🛠️ FIX 3: Filter for the CURRENT USER FIRST, rather than auto-expiring the entire global database.
    const userRentals = rentals.filter((rental) => rental.user_id === userId);
    const activeRentalsForUser = [];

    // 3) Auto-expire past-due rentals ONLY for this user, keep active ones
    for (const rental of userRentals) {
      if (rental.status === "active") {
        if (rental.expires_at && new Date(rental.expires_at) <= now) {
          await base44Put(`/entities/FilmRental/${rental.id}`, {
            status: "expired",
          });
        } else {
          activeRentalsForUser.push(rental);
        }
      }
    }

    // 4) If none, return empty data
    if (!activeRentalsForUser.length) {
      return Response.json(
        { data: [] },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 5) Fetch Film details for each active rental
    const filmIds = [...new Set(activeRentalsForUser.map((r) => r.film_id))];
    const filmsMap = {};

    for (const filmId of filmIds) {
      const film = await base44Get(`/entities/Film/${filmId}`);
      filmsMap[film.id] = film;
    }

    // 6) Build response in the shape the tvOS app expects
    const rentalData = activeRentalsForUser.map((rental) => {
      const film = filmsMap[rental.film_id];

      return {
        film: film
          ? {
              id: film.id,
              slug: film.slug,
              title: film.title,
              short_description: film.short_description,
              poster_url: film.thumbnail_url,
              hls_url: film.hls_playback_url,
            }
          : null,
        status: rental.status,
        purchased_at: rental.purchased_at ?? rental.created_date,
        expires_at: rental.expires_at,
      };
    });

    return Response.json(
      { data: rentalData },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("My rentals API error:", error);
    return Response.json(
      {
        error: "Failed to fetch rentals",
        debug: String(error?.message || error),
      },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});