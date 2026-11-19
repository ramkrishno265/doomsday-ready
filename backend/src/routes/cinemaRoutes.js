const express = require("express");
const {
  createCinema,
  listCinemas,
  getBookingQuote,
} = require("../controllers/cinemaController");

const router = express.Router();

router.post("/", createCinema);
router.get("/", listCinemas);
router.get("/:id/booking", getBookingQuote);

module.exports = router;