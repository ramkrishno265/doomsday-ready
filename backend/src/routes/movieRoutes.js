const express = require("express");
const {
  createMovie,
  listMovies,
  updateMovie,
  getMovieRewatchOrder,
} = require("../controllers/movieController");

const router = express.Router();

router.post("/", createMovie);
router.get("/", listMovies);
router.patch("/:id", updateMovie);
router.get("/:id/rewatch-order", getMovieRewatchOrder);

module.exports = router;