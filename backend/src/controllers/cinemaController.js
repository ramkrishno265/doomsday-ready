const prisma = require("../db/prisma");
const { solveBookingBundles } = require("../services/bookingSolver");

function validateBundleSizes(bundleSizes) {
  if (!Array.isArray(bundleSizes) || bundleSizes.length < 1 || bundleSizes.length > 10) {
    return "bundleSizes must be an array with between 1 and 10 bundle sizes";
  }

  for (const size of bundleSizes) {
    if (!Number.isInteger(size) || size < 1 || size > 500) {
      return "Each bundle size must be an integer between 1 and 500";
    }
  }

  const uniqueCount = new Set(bundleSizes).size;
  if (uniqueCount !== bundleSizes.length) {
    return "bundleSizes must not contain duplicate values";
  }

  return null;
}

// POST /api/cinemas
async function createCinema(req, res) {
  try {
    const { name, bundleSizes } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Cinema name is required",
      });
    }

    const validationError = validateBundleSizes(bundleSizes);
    if (validationError) {
      return res.status(400).json({
        error: "INVALID_BUNDLE_SIZES",
        message: validationError,
      });
    }

    const sortedSizes = [...bundleSizes].sort((a, b) => a - b);

    const created = await prisma.cinema.create({
      data: {
        name: name.trim(),
        bundleSizes: sortedSizes,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "DUPLICATE_NAME",
        message: "Cinema name must be unique",
      });
    }
    console.error("createCinema error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

// GET /api/cinemas
async function listCinemas(req, res) {
  try {
    const cinemas = await prisma.cinema.findMany({
      orderBy: { id: "asc" },
    });
    return res.json(cinemas);
  } catch (err) {
    console.error("listCinemas error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

// GET /api/cinemas/:id/booking?groupSize=6
async function getBookingQuote(req, res) {
  try {
    const cinemaId = Number(req.params.id);
    if (!Number.isInteger(cinemaId) || cinemaId <= 0) {
      return res.status(400).json({
        error: "INVALID_ID",
        message: "Invalid cinema ID",
      });
    }

    const rawGroupSize = req.query.groupSize;
    const groupSize = Number(rawGroupSize);

    if (
      rawGroupSize === undefined ||
      rawGroupSize === "" ||
      !Number.isInteger(groupSize) ||
      groupSize < 1 ||
      groupSize > 10000
    ) {
      return res.status(400).json({
        error: "INVALID_GROUP_SIZE",
        message: "groupSize must be an integer between 1 and 10000",
      });
    }

    const cinema = await prisma.cinema.findUnique({
      where: { id: cinemaId },
    });

    if (!cinema) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "Cinema not found",
      });
    }

    const quote = solveBookingBundles(cinema.bundleSizes, groupSize);

    return res.json({
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      bundleSizes: cinema.bundleSizes,
      ...quote,
    });
  } catch (err) {
    console.error("getBookingQuote error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = {
  createCinema,
  listCinemas,
  getBookingQuote,
};