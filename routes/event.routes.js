const express = require("express");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const Concert = require("../models/Concert.model");
const Theater = require("../models/Theater.model");
const Museum = require("../models/Museum.model");
const Book = require("../models/Book.model");
const Restaurant = require("../models/Restaurant.model");
const router = express.Router();

router.get("/events", async (req, res, next) => {
  const events = {};

  try {
    events.concerts = (await Concert.find()) || [];
    events.theaters = (await Theater.find()) || [];
    events.museums = (await Museum.find()) || [];
    events.books = (await Book.find()) || [];
    events.restaurants = (await Restaurant.find()) || [];

    res.status(200).json(events);
  } catch (err) {
    console.log(err);
    if (err.message) {
      res.status(500).json({
        message: err.message,
        detail: String(err),
      });
    } else {
      res.status(500).json({
        message: "Internal Server Error occurs during all events retrieval",
        detail: String(err),
      });
    }
  }
});

module.exports = router;
