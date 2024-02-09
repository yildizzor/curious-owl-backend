const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");
const Review = require("../models/Review.model");

// Update a review to comment.
router.put("/review/:reviewId", isAuthenticated, async (req, res, next) => {
  const errorsOfReview = {};
  const { reviewId } = req.params;

  const { rating, comment } = req.body;
  try {
    const review = await Review.findByIdAndUpdate(reviewId, { ...req.body });

    res.status(200).json(review);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
      // element = as cocertName, soloistName (field of model)
      // message is inside err.errors, so we can see it if the error occurs.
      Object.keys(err.errors).forEach((element) => {
        errorsOfReview[element] = err.errors[element].message;
      });
      res.status(400).json(errorsOfReview);
    } else if (err.message) {
      errorsOfReview.message = err.message;
      errorsOfReview.detail = String(err);
      res.status(500).json(errorsOfReview);
    } else {
      errorsOfReview.message =
        "Internal Server Error occurs during all events retrieval";
      errorsOfReview.detail = String(err);
      res.status(500).json(errorsOfReview);
    }
  }
});

// router.post(
//   "/events/:eventId/reviews",
//   isAuthenticated,
//   async (req, res, next) => {
//     const errorsOfReview = {};
//     const { eventId } = req.params;

//     const { date, rating, comment, createdBy } = req.body;
//     try {
//       const review = await Review.create({ ...req.body, event: eventId });

//       res.status(201).json(review);
//     } catch (err) {
//       if (err instanceof mongoose.Error.ValidationError) {
//         //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
//         // element = as cocertName, soloistName (field of model)
//         // message is inside err.errors, so we can see it if the error occurs.
//         Object.keys(err.errors).forEach((element) => {
//           errorsOfReview[element] = err.errors[element].message;
//         });
//         res.status(400).json(errorsOfReview);
//       } else if (err.message) {
//         errorsOfReview.message = err.message;
//         errorsOfReview.detail = String(err);
//         res.status(500).json(errorsOfReview);
//       } else {
//         errorsOfReview.message =
//           "Internal Server Error occurs during all events retrieval";
//         errorsOfReview.detail = String(err);
//         res.status(500).json(errorsOfReview);
//       }
//     }
//   }
// );

module.exports = router;
