const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || "Request failed");
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  // Movies
  getMovies: () => request("/movies"),
  createMovie: (payload) =>
    request("/movies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateMovie: (id, payload) =>
    request(`/movies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getRewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),

  // Cinemas & Booking
  getCinemas: () => request("/cinemas"),
  createCinema: (payload) =>
    request("/cinemas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getBookingQuote: (cinemaId, groupSize) =>
    request(`/cinemas/${cinemaId}/booking?groupSize=${encodeURIComponent(groupSize)}`),
};