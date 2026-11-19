const prisma = require("../db/prisma");
const { wouldCreateCycle, getRewatchOrder } = require("../services/movieGraph");

function formatMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    watched: movie.watched,
    prerequisites: (movie.prerequisites || []).map((p) => ({
      id: p.id,
      title: p.title,
      watched: p.watched,
      runtimeMinutes: p.runtimeMinutes,
    })),
    prerequisiteIds: (movie.prerequisites || []).map((p) => p.id),
  };
}

function validateRuntime(runtimeMinutes) {
  return Number.isInteger(runtimeMinutes) && runtimeMinutes >= 1 && runtimeMinutes <= 300;
}

// POST /api/movies
async function createMovie(req, res) {
  try {
    const { title, releaseYear, runtimeMinutes, watched = false, prerequisiteIds = [] } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "INVALID_INPUT", message: "Title is required" });
    }

    if (!Number.isInteger(releaseYear)) {
      return res.status(400).json({ error: "INVALID_INPUT", message: "releaseYear must be an integer" });
    }

    if (!validateRuntime(runtimeMinutes)) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "runtimeMinutes must be an integer between 1 and 300",
      });
    }

    const uniquePrereqIds = [...new Set(Array.isArray(prerequisiteIds) ? prerequisiteIds : [])];

    if (uniquePrereqIds.length > 0) {
      const existingPrereqs = await prisma.movie.findMany({
        where: { id: { in: uniquePrereqIds } },
        select: { id: true },
      });

      if (existingPrereqs.length !== uniquePrereqIds.length) {
        return res.status(400).json({
          error: "INVALID_PREREQUISITE",
          message: "One or more prerequisite movie IDs do not exist",
        });
      }

      const rawMovies = await prisma.movie.findMany({
        include: { prerequisites: { select: { id: true } } },
      });

      const graphInput = rawMovies.map((m) => ({
        id: m.id,
        title: m.title,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
        prerequisiteIds: m.prerequisites.map((p) => p.id),
      }));

      if (wouldCreateCycle(graphInput, null, uniquePrereqIds)) {
        return res.status(409).json({
          error: "CIRCULAR_DEPENDENCY",
          message: "Prerequisites would create a circular dependency",
        });
      }
    }

    const created = await prisma.movie.create({
      data: {
        title: title.trim(),
        releaseYear,
        runtimeMinutes,
        watched: Boolean(watched),
        prerequisites:
          uniquePrereqIds.length > 0
            ? { connect: uniquePrereqIds.map((id) => ({ id })) }
            : undefined,
      },
      include: { prerequisites: true },
    });

    return res.status(201).json(formatMovie(created));
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "DUPLICATE_TITLE", message: "Movie title must be unique" });
    }
    console.error("createMovie error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

// GET /api/movies
async function listMovies(req, res) {
  try {
    const movies = await prisma.movie.findMany({
      include: { prerequisites: true },
      orderBy: [{ releaseYear: "asc" }, { id: "asc" }],
    });

    return res.json(movies.map(formatMovie));
  } catch (err) {
    console.error("listMovies error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

// PATCH /api/movies/:id
async function updateMovie(req, res) {
  try {
    const movieId = Number(req.params.id);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({ error: "INVALID_ID", message: "Invalid movie ID" });
    }

    const existing = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { prerequisites: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Movie not found" });
    }

    const { title, releaseYear, runtimeMinutes, watched, prerequisiteIds } = req.body;

    if (runtimeMinutes !== undefined && !validateRuntime(runtimeMinutes)) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "runtimeMinutes must be an integer between 1 and 300",
      });
    }

    if (releaseYear !== undefined && !Number.isInteger(releaseYear)) {
      return res.status(400).json({ error: "INVALID_INPUT", message: "releaseYear must be an integer" });
    }

    let prerequisiteUpdate;
    if (prerequisiteIds !== undefined) {
      if (!Array.isArray(prerequisiteIds)) {
        return res.status(400).json({
          error: "INVALID_INPUT",
          message: "prerequisiteIds must be an array",
        });
      }

      const uniquePrereqIds = [...new Set(prerequisiteIds)];

      if (uniquePrereqIds.length > 0) {
        const foundPrereqs = await prisma.movie.findMany({
          where: { id: { in: uniquePrereqIds } },
          select: { id: true },
        });
        if (foundPrereqs.length !== uniquePrereqIds.length) {
          return res.status(400).json({
            error: "INVALID_PREREQUISITE",
            message: "One or more prerequisite movie IDs do not exist",
          });
        }
      }

      const rawMovies = await prisma.movie.findMany({
        include: { prerequisites: { select: { id: true } } },
      });

      const graphInput = rawMovies.map((m) => ({
        id: m.id,
        title: m.title,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
        prerequisiteIds: m.prerequisites.map((p) => p.id),
      }));

      if (wouldCreateCycle(graphInput, movieId, uniquePrereqIds)) {
        return res.status(409).json({
          error: "CIRCULAR_DEPENDENCY",
          message: "Updating prerequisites would create a circular dependency",
        });
      }

      prerequisiteUpdate = {
        set: uniquePrereqIds.map((id) => ({ id })),
      };
    }

    const updated = await prisma.movie.update({
      where: { id: movieId },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(releaseYear !== undefined ? { releaseYear } : {}),
        ...(runtimeMinutes !== undefined ? { runtimeMinutes } : {}),
        ...(watched !== undefined ? { watched: Boolean(watched) } : {}),
        ...(prerequisiteUpdate !== undefined ? { prerequisites: prerequisiteUpdate } : {}),
      },
      include: { prerequisites: true },
    });

    return res.json(formatMovie(updated));
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "DUPLICATE_TITLE", message: "Movie title must be unique" });
    }
    console.error("updateMovie error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

// GET /api/movies/:id/rewatch-order
async function getMovieRewatchOrder(req, res) {
  try {
    const movieId = Number(req.params.id);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({ error: "INVALID_ID", message: "Invalid movie ID" });
    }

    const rawMovies = await prisma.movie.findMany({
      include: { prerequisites: { select: { id: true } } },
    });

    const targetExists = rawMovies.some((m) => m.id === movieId);
    if (!targetExists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Movie not found" });
    }

    const graphInput = rawMovies.map((m) => ({
      id: m.id,
      title: m.title,
      releaseYear: m.releaseYear,
      runtimeMinutes: m.runtimeMinutes,
      watched: m.watched,
      prerequisiteIds: m.prerequisites.map((p) => p.id),
    }));

    const result = getRewatchOrder(graphInput, movieId);
    return res.json(result);
  } catch (err) {
    if (err.message === "CIRCULAR_DEPENDENCY") {
      return res.status(409).json({
        error: "CIRCULAR_DEPENDENCY",
        message: "Circular dependency detected in movie prerequisites",
      });
    }
    console.error("getMovieRewatchOrder error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = {
  createMovie,
  listMovies,
  updateMovie,
  getMovieRewatchOrder,
};